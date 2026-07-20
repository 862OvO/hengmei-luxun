import {
    withSupabase
} from "npm:@supabase/server@^1";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIONS = new Set([
    "list",
    "list-logs",
    "hide",
    "restore",
    "delete"
]);

const MODERATION_ACTIONS = new Set([
    "hide",
    "restore",
    "delete"
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
    return typeof value === "string"
        ? value.trim()
        : "";
}

function getLimit(
    value: unknown,
    fallback = 100
): number {
    const parsed = Number(value);

    if (
        !Number.isInteger(parsed) ||
        parsed < 1
    ) {
        return fallback;
    }

    return Math.min(parsed, 200);
}

async function requireActiveAdmin(
    supabaseAdmin: any,
    userId: string
) {
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
                    "account_status"
                ].join(",")
            )
            .eq("id", userId)
            .maybeSingle();

    if (error) {
        console.error(
            "Administrator check failed:",
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
            "当前账号没有有效的管理员权限。"
        );
    }

    return profile;
}

async function listMessages(
    supabaseAdmin: any
) {
    const {
        data: messages,
        error: messagesError
    } =
        await supabaseAdmin
            .from("messages")
            .select(
                [
                    "id",
                    "user_id",
                    "content",
                    "status",
                    "hidden_reason",
                    "hidden_at",
                    "hidden_by",
                    "created_at",
                    "updated_at"
                ].join(",")
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (messagesError) {
        throw messagesError;
    }

    const userIds = Array.from(
        new Set(
            (messages ?? [])
                .map(
                    (item: any) =>
                        item.user_id
                )
                .filter(Boolean)
        )
    );

    const profileMap =
        new Map<string, any>();

    if (userIds.length > 0) {
        const {
            data: profiles,
            error: profilesError
        } =
            await supabaseAdmin
                .from("profiles")
                .select(
                    "id, nickname, role, account_status"
                )
                .in("id", userIds);

        if (profilesError) {
            throw profilesError;
        }

        (profiles ?? []).forEach(
            (profile: any) => {
                profileMap.set(
                    profile.id,
                    profile
                );
            }
        );
    }

    const normalized =
        (messages ?? []).map(
            (message: any) => {
                const profile =
                    profileMap.get(
                        message.user_id
                    );

                return {
                    message_id:
                        message.id,
                    user_id:
                        message.user_id,
                    nickname:
                        profile?.nickname ||
                        "已注销用户",
                    user_role:
                        profile?.role ||
                        "user",
                    user_account_status:
                        profile?.account_status ||
                        "unknown",
                    content:
                        message.content,
                    status:
                        message.status,
                    hidden_reason:
                        message.hidden_reason,
                    hidden_at:
                        message.hidden_at,
                    hidden_by:
                        message.hidden_by,
                    created_at:
                        message.created_at,
                    updated_at:
                        message.updated_at,
                    is_edited:
                        Boolean(
                            message.updated_at &&
                            message.created_at &&
                            new Date(
                                message.updated_at
                            ).getTime() >
                            new Date(
                                message.created_at
                            ).getTime()
                        )
                };
            }
        );

    return {
        messages: normalized,
        counts: {
            total: normalized.length,
            visible:
                normalized.filter(
                    (item: any) =>
                        item.status ===
                        "visible"
                ).length,
            hidden:
                normalized.filter(
                    (item: any) =>
                        item.status ===
                        "hidden"
                ).length
        }
    };
}

async function listLogs(
    supabaseAdmin: any,
    limit: number
) {
    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "message_moderation_logs"
            )
            .select(
                [
                    "id",
                    "message_id",
                    "user_id",
                    "nickname_snapshot",
                    "content_snapshot",
                    "action",
                    "reason",
                    "admin_id",
                    "created_at"
                ].join(",")
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(limit);

    if (error) {
        throw error;
    }

    return {
        logs: data ?? []
    };
}

function getHttpStatus(
    message: string
): number {
    if (
        message.includes(
            "没有有效的管理员权限"
        )
    ) {
        return 403;
    }

    if (
        message.includes(
            "没有找到对应留言"
        )
    ) {
        return 404;
    }

    if (
        message.includes(
            "只有"
        )
    ) {
        return 409;
    }

    if (
        message.includes(
            "格式"
        ) ||
        message.includes(
            "必须"
        ) ||
        message.includes(
            "不支持"
        )
    ) {
        return 400;
    }

    return 500;
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
                return Response.json(
                    {
                        error:
                            "只允许使用 POST 请求。"
                    },
                    {
                        status: 405
                    }
                );
            }

            const userId =
                getUserId(
                    context.userClaims,
                    context.jwtClaims
                );

            if (!userId) {
                return Response.json(
                    {
                        error:
                            "无法识别当前登录用户。"
                    },
                    {
                        status: 401
                    }
                );
            }

            let body:
                Record<string, unknown>;

            try {
                body =
                    await request.json();
            } catch {
                return Response.json(
                    {
                        error:
                            "请求内容不是有效的 JSON。"
                    },
                    {
                        status: 400
                    }
                );
            }

            const action =
                normalizeText(
                    body.action
                ).toLowerCase();

            if (!ACTIONS.has(action)) {
                return Response.json(
                    {
                        error:
                            "不支持的留言管理操作。"
                    },
                    {
                        status: 400
                    }
                );
            }

            try {
                await requireActiveAdmin(
                    context.supabaseAdmin,
                    userId
                );

                if (action === "list") {
                    const result =
                        await listMessages(
                            context.supabaseAdmin
                        );

                    return Response.json({
                        success: true,
                        ...result
                    });
                }

                if (
                    action ===
                    "list-logs"
                ) {
                    const result =
                        await listLogs(
                            context.supabaseAdmin,
                            getLimit(body.limit)
                        );

                    return Response.json({
                        success: true,
                        ...result
                    });
                }

                const messageId =
                    normalizeText(
                        body.messageId
                    );

                const reason =
                    normalizeText(
                        body.reason
                    );

                if (
                    !UUID_PATTERN.test(
                        messageId
                    )
                ) {
                    return Response.json(
                        {
                            error:
                                "留言编号格式不正确。"
                        },
                        {
                            status: 400
                        }
                    );
                }

                if (
                    !MODERATION_ACTIONS
                        .has(action)
                ) {
                    return Response.json(
                        {
                            error:
                                "不支持的留言审核操作。"
                        },
                        {
                            status: 400
                        }
                    );
                }

                if (
                    reason.length < 1 ||
                    reason.length > 300
                ) {
                    return Response.json(
                        {
                            error:
                                "处理原因必须为 1 至 300 个字符。"
                        },
                        {
                            status: 400
                        }
                    );
                }

                const {
                    data,
                    error
                } =
                    await context
                        .supabaseAdmin
                        .rpc(
                            "moderate_message_action",
                            {
                                p_message_id:
                                    messageId,
                                p_action:
                                    action,
                                p_reason:
                                    reason,
                                p_admin_id:
                                    userId
                            }
                        );

                if (error) {
                    console.error(
                        "Message moderation failed:",
                        error
                    );

                    const message =
                        error.message ||
                        "留言审核操作失败。";

                    return Response.json(
                        {
                            error: message
                        },
                        {
                            status:
                                getHttpStatus(
                                    message
                                )
                        }
                    );
                }

                return Response.json({
                    success: true,
                    result: data
                });
            } catch (error) {
                console.error(
                    "Message moderation request failed:",
                    error
                );

                const message =
                    error instanceof Error
                        ? error.message
                        : "留言管理请求失败。";

                return Response.json(
                    {
                        error: message
                    },
                    {
                        status:
                            getHttpStatus(
                                message
                            )
                    }
                );
            }
        }
    )
};
