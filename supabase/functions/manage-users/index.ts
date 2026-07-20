import {
    withSupabase
} from "npm:@supabase/server@^1";

const PERMANENT_BAN_DURATION =
    "876000h";

const MAX_TEMPORARY_BAN_DAYS =
    365;

const DELETION_WAIT_DAYS =
    7;

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIONS = new Set([
    "list",
    "ban",
    "unban",
    "schedule-deletion",
    "restore-deletion",
    "delete-user"
]);

function readClaim(
    claims: unknown,
    key: string
): string {
    if (
        !claims ||
        typeof claims !== "object"
    ) {
        return "";
    }

    const value =
        (
            claims as
            Record<string, unknown>
        )[key];

    return typeof value === "string"
        ? value
        : "";
}

function getUserId(
    userClaims: unknown,
    jwtClaims: unknown
): string {
    return (
        readClaim(userClaims, "sub") ||
        readClaim(userClaims, "id") ||
        readClaim(jwtClaims, "sub")
    );
}

function normalizeText(
    value: unknown
): string {
    return String(value ?? "").trim();
}

function jsonError(
    message: string,
    status = 400
): Response {
    return Response.json(
        { error: message },
        { status }
    );
}

function validateReason(
    value: unknown
): string {
    const reason = normalizeText(value);

    if (
        reason.length < 1 ||
        reason.length > 300
    ) {
        throw new Error(
            "处理原因必须填写，长度为 1～300 个字符。"
        );
    }

    return reason;
}

function validateUserId(
    value: unknown
): string {
    const userId = normalizeText(value);

    if (!UUID_PATTERN.test(userId)) {
        throw new Error(
            "用户编号格式不正确。"
        );
    }

    return userId;
}

function parseTemporaryBanDays(
    value: unknown
): number {
    const days = Number(value);

    if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > MAX_TEMPORARY_BAN_DAYS
    ) {
        throw new Error(
            `临时封禁天数必须是 1～${MAX_TEMPORARY_BAN_DAYS} 的整数。`
        );
    }

    return days;
}

async function requireActiveAdmin(
    supabaseAdmin: any,
    callerId: string
) {
    const {
        data: profile,
        error
    } =
        await supabaseAdmin
            .from("profiles")
            .select(
                "id, nickname, role, account_status"
            )
            .eq("id", callerId)
            .maybeSingle();

    if (error) {
        console.error(
            "Administrator lookup failed:",
            error
        );

        throw new Error(
            "管理员身份检查失败。"
        );
    }

    if (
        !profile ||
        profile.role !== "admin" ||
        profile.account_status !== "active"
    ) {
        throw new Error(
            "当前账号没有可用的管理员权限。"
        );
    }

    return profile;
}

async function clearProfileToActive(
    supabaseAdmin: any,
    userId: string
) {
    const { error } =
        await supabaseAdmin
            .from("profiles")
            .update({
                account_status: "active",
                ban_type: null,
                ban_reason: null,
                banned_at: null,
                banned_until: null,
                banned_by: null,
                deletion_requested_at: null,
                deletion_effective_after: null,
                deletion_reason: null,
                deletion_requested_by: null
            })
            .eq("id", userId);

    if (error) {
        throw error;
    }
}

async function normalizeExpiredTemporaryBans(
    supabaseAdmin: any
) {
    const nowIso =
        new Date().toISOString();

    const {
        data: expiredProfiles,
        error
    } =
        await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("account_status", "banned")
            .eq("ban_type", "temporary")
            .lte("banned_until", nowIso);

    if (error) {
        console.error(
            "Expired ban lookup failed:",
            error
        );

        return;
    }

    for (
        const profile of
        expiredProfiles ?? []
    ) {
        const {
            error: authError
        } =
            await supabaseAdmin.auth.admin
                .updateUserById(
                    profile.id,
                    {
                        ban_duration: "none"
                    }
                );

        if (authError) {
            console.error(
                "Expired auth ban cleanup failed:",
                profile.id,
                authError
            );

            continue;
        }

        try {
            await clearProfileToActive(
                supabaseAdmin,
                profile.id
            );
        } catch (profileError) {
            console.error(
                "Expired profile ban cleanup failed:",
                profile.id,
                profileError
            );
        }
    }
}

async function getTargetProfile(
    supabaseAdmin: any,
    targetUserId: string,
    callerId: string
) {
    if (targetUserId === callerId) {
        throw new Error(
            "不能对当前登录的管理员账号执行此操作。"
        );
    }

    const {
        data: profile,
        error
    } =
        await supabaseAdmin
            .from("profiles")
            .select(
                [
                    "id",
                    "nickname",
                    "role",
                    "account_status",
                    "ban_type",
                    "ban_reason",
                    "banned_at",
                    "banned_until",
                    "deletion_requested_at",
                    "deletion_effective_after",
                    "deletion_reason"
                ].join(",")
            )
            .eq("id", targetUserId)
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!profile) {
        throw new Error(
            "没有找到对应用户资料。"
        );
    }

    if (profile.role === "admin") {
        throw new Error(
            "管理员账号不能在用户管理面板中被封禁或删除。"
        );
    }

    return profile;
}

async function listManagedUsers(
    supabaseAdmin: any,
    callerId: string
) {
    const {
        data: authData,
        error: authError
    } =
        await supabaseAdmin.auth.admin
            .listUsers({
                page: 1,
                perPage: 1000
            });

    if (authError) {
        throw authError;
    }

    const authUsers =
        authData?.users ?? [];

    const userIds =
        authUsers.map(
            (user: any) => user.id
        );

    let profiles: any[] = [];

    if (userIds.length > 0) {
        const {
            data,
            error
        } =
            await supabaseAdmin
                .from("profiles")
                .select(
                    [
                        "id",
                        "nickname",
                        "role",
                        "account_status",
                        "ban_type",
                        "ban_reason",
                        "banned_at",
                        "banned_until",
                        "deletion_requested_at",
                        "deletion_effective_after",
                        "deletion_reason",
                        "created_at"
                    ].join(",")
                )
                .in("id", userIds);

        if (error) {
            throw error;
        }

        profiles = data ?? [];
    }

    const profileMap =
        new Map(
            profiles.map(
                (profile: any) => [
                    profile.id,
                    profile
                ]
            )
        );

    const users =
        authUsers
            .map((user: any) => {
                const profile =
                    profileMap.get(user.id) ?? {};

                return {
                    id: user.id,
                    email: user.email ?? "",
                    email_confirmed_at:
                        user.email_confirmed_at ??
                        null,
                    last_sign_in_at:
                        user.last_sign_in_at ??
                        null,
                    auth_created_at:
                        user.created_at ?? null,
                    auth_banned_until:
                        user.banned_until ?? null,
                    nickname:
                        profile.nickname ?? "",
                    role:
                        profile.role ?? "user",
                    account_status:
                        profile.account_status ??
                        "active",
                    ban_type:
                        profile.ban_type ?? null,
                    ban_reason:
                        profile.ban_reason ?? null,
                    banned_at:
                        profile.banned_at ?? null,
                    banned_until:
                        profile.banned_until ?? null,
                    deletion_requested_at:
                        profile.deletion_requested_at ??
                        null,
                    deletion_effective_after:
                        profile.deletion_effective_after ??
                        null,
                    deletion_reason:
                        profile.deletion_reason ?? null,
                    is_current_admin:
                        user.id === callerId
                };
            })
            .sort((left: any, right: any) => {
                const leftDate =
                    Date.parse(
                        left.auth_created_at ?? ""
                    ) || 0;

                const rightDate =
                    Date.parse(
                        right.auth_created_at ?? ""
                    ) || 0;

                return rightDate - leftDate;
            });

    return users;
}

async function banUser(
    supabaseAdmin: any,
    callerId: string,
    requestBody: Record<string, unknown>
) {
    const targetUserId =
        validateUserId(
            requestBody.userId
        );

    const reason =
        validateReason(
            requestBody.reason
        );

    const banType =
        normalizeText(
            requestBody.banType
        );

    if (
        banType !== "temporary" &&
        banType !== "permanent"
    ) {
        throw new Error(
            "请选择临时封禁或永久封禁。"
        );
    }

    const targetProfile =
        await getTargetProfile(
            supabaseAdmin,
            targetUserId,
            callerId
        );

    if (
        targetProfile.account_status !==
        "active"
    ) {
        throw new Error(
            "只有正常账号可以执行封禁；请先恢复或解封当前账号。"
        );
    }

    const now = new Date();

    let duration =
        PERMANENT_BAN_DURATION;

    let bannedUntil: string | null =
        null;

    let days: number | null = null;

    if (banType === "temporary") {
        days = parseTemporaryBanDays(
            requestBody.days
        );

        duration = `${days * 24}h`;

        bannedUntil =
            new Date(
                now.getTime() +
                days * 24 * 60 * 60 * 1000
            ).toISOString();
    }

    const {
        error: authError
    } =
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration: duration
                }
            );

    if (authError) {
        throw authError;
    }

    const {
        error: profileError
    } =
        await supabaseAdmin
            .from("profiles")
            .update({
                account_status: "banned",
                ban_type: banType,
                ban_reason: reason,
                banned_at: now.toISOString(),
                banned_until: bannedUntil,
                banned_by: callerId,
                deletion_requested_at: null,
                deletion_effective_after: null,
                deletion_reason: null,
                deletion_requested_by: null
            })
            .eq("id", targetUserId);

    if (profileError) {
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration: "none"
                }
            );

        throw profileError;
    }

    return {
        success: true,
        action: "ban",
        userId: targetUserId,
        banType,
        days,
        bannedUntil
    };
}

async function unbanUser(
    supabaseAdmin: any,
    callerId: string,
    requestBody: Record<string, unknown>
) {
    const targetUserId =
        validateUserId(
            requestBody.userId
        );

    const targetProfile =
        await getTargetProfile(
            supabaseAdmin,
            targetUserId,
            callerId
        );

    if (
        targetProfile.account_status !==
        "banned"
    ) {
        throw new Error(
            "该账号当前不处于封禁状态。"
        );
    }

    const {
        error: authError
    } =
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration: "none"
                }
            );

    if (authError) {
        throw authError;
    }

    try {
        await clearProfileToActive(
            supabaseAdmin,
            targetUserId
        );
    } catch (profileError) {
        const rollbackDuration =
            targetProfile.ban_type ===
            "permanent"
                ? PERMANENT_BAN_DURATION
                : "24h";

        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration:
                        rollbackDuration
                }
            );

        throw profileError;
    }

    return {
        success: true,
        action: "unban",
        userId: targetUserId
    };
}

async function scheduleDeletion(
    supabaseAdmin: any,
    callerId: string,
    requestBody: Record<string, unknown>
) {
    const targetUserId =
        validateUserId(
            requestBody.userId
        );

    const reason =
        validateReason(
            requestBody.reason
        );

    const targetProfile =
        await getTargetProfile(
            supabaseAdmin,
            targetUserId,
            callerId
        );

    if (
        targetProfile.account_status !==
        "active"
    ) {
        throw new Error(
            "只有正常账号可以进入待删除状态；请先解封当前账号。"
        );
    }

    const requestedAt = new Date();

    const effectiveAfter =
        new Date(
            requestedAt.getTime() +
            DELETION_WAIT_DAYS *
            24 * 60 * 60 * 1000
        );

    const {
        error: authError
    } =
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration:
                        PERMANENT_BAN_DURATION
                }
            );

    if (authError) {
        throw authError;
    }

    const {
        error: profileError
    } =
        await supabaseAdmin
            .from("profiles")
            .update({
                account_status:
                    "pending_deletion",
                ban_type: null,
                ban_reason: null,
                banned_at: null,
                banned_until: null,
                banned_by: null,
                deletion_requested_at:
                    requestedAt.toISOString(),
                deletion_effective_after:
                    effectiveAfter.toISOString(),
                deletion_reason: reason,
                deletion_requested_by:
                    callerId
            })
            .eq("id", targetUserId);

    if (profileError) {
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration: "none"
                }
            );

        throw profileError;
    }

    return {
        success: true,
        action: "schedule-deletion",
        userId: targetUserId,
        effectiveAfter:
            effectiveAfter.toISOString()
    };
}

async function restoreDeletion(
    supabaseAdmin: any,
    callerId: string,
    requestBody: Record<string, unknown>
) {
    const targetUserId =
        validateUserId(
            requestBody.userId
        );

    const targetProfile =
        await getTargetProfile(
            supabaseAdmin,
            targetUserId,
            callerId
        );

    if (
        targetProfile.account_status !==
        "pending_deletion"
    ) {
        throw new Error(
            "该账号当前不处于待删除状态。"
        );
    }

    const {
        error: authError
    } =
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration: "none"
                }
            );

    if (authError) {
        throw authError;
    }

    try {
        await clearProfileToActive(
            supabaseAdmin,
            targetUserId
        );
    } catch (profileError) {
        await supabaseAdmin.auth.admin
            .updateUserById(
                targetUserId,
                {
                    ban_duration:
                        PERMANENT_BAN_DURATION
                }
            );

        throw profileError;
    }

    return {
        success: true,
        action: "restore-deletion",
        userId: targetUserId
    };
}

async function deleteUserPermanently(
    supabaseAdmin: any,
    callerId: string,
    requestBody: Record<string, unknown>
) {
    const targetUserId =
        validateUserId(
            requestBody.userId
        );

    const targetProfile =
        await getTargetProfile(
            supabaseAdmin,
            targetUserId,
            callerId
        );

    if (
        targetProfile.account_status !==
        "pending_deletion"
    ) {
        throw new Error(
            "只有待删除账号才能永久删除。"
        );
    }

    const effectiveTime =
        Date.parse(
            targetProfile
                .deletion_effective_after ??
            ""
        );

    if (
        !Number.isFinite(effectiveTime) ||
        Date.now() < effectiveTime
    ) {
        throw new Error(
            "七天等待期尚未结束，暂时不能永久删除该账号。"
        );
    }

    const {
        data,
        error
    } =
        await supabaseAdmin.auth.admin
            .deleteUser(
                targetUserId,
                false
            );

    if (error) {
        throw error;
    }

    return {
        success: true,
        action: "delete-user",
        userId: targetUserId,
        deletedUserId:
            data?.user?.id ??
            targetUserId
    };
}

export default {
    fetch: withSupabase(
        {
            auth: "user"
        },

        async (
            request,
            context
        ) => {
            if (
                request.method !==
                "POST"
            ) {
                return jsonError(
                    "只允许使用 POST 请求。",
                    405
                );
            }

            const callerId =
                getUserId(
                    context.userClaims,
                    context.jwtClaims
                );

            if (!callerId) {
                return jsonError(
                    "无法识别当前登录用户。",
                    401
                );
            }

            let requestBody:
                Record<string, unknown>;

            try {
                requestBody =
                    await request.json();
            } catch {
                return jsonError(
                    "请求内容不是有效的 JSON。"
                );
            }

            const action =
                normalizeText(
                    requestBody.action
                );

            if (!ACTIONS.has(action)) {
                return jsonError(
                    "用户管理操作类型不正确。"
                );
            }

            try {
                await requireActiveAdmin(
                    context.supabaseAdmin,
                    callerId
                );

                await normalizeExpiredTemporaryBans(
                    context.supabaseAdmin
                );

                if (action === "list") {
                    const users =
                        await listManagedUsers(
                            context.supabaseAdmin,
                            callerId
                        );

                    return Response.json({
                        success: true,
                        users
                    });
                }

                let result;

                switch (action) {
                    case "ban":
                        result =
                            await banUser(
                                context.supabaseAdmin,
                                callerId,
                                requestBody
                            );
                        break;

                    case "unban":
                        result =
                            await unbanUser(
                                context.supabaseAdmin,
                                callerId,
                                requestBody
                            );
                        break;

                    case "schedule-deletion":
                        result =
                            await scheduleDeletion(
                                context.supabaseAdmin,
                                callerId,
                                requestBody
                            );
                        break;

                    case "restore-deletion":
                        result =
                            await restoreDeletion(
                                context.supabaseAdmin,
                                callerId,
                                requestBody
                            );
                        break;

                    case "delete-user":
                        result =
                            await deleteUserPermanently(
                                context.supabaseAdmin,
                                callerId,
                                requestBody
                            );
                        break;

                    default:
                        return jsonError(
                            "不支持该用户管理操作。"
                        );
                }

                return Response.json(result);
            } catch (error) {
                console.error(
                    "Manage users failed:",
                    error
                );

                const message =
                    error instanceof Error
                        ? error.message
                        : "用户管理操作失败。";

                const status =
                    message.includes(
                        "管理员权限"
                    )
                        ? 403
                        : 400;

                return jsonError(
                    message,
                    status
                );
            }
        }
    )
};
