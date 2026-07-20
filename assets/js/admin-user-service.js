import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

const FUNCTION_NAME = "manage-users";

function ensureConfigured() {
    if (!isSupabaseConfigured()) {
        throw new Error(
            "Supabase 尚未正确配置。"
        );
    }
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

async function readFunctionError(error) {
    let message =
        normalizeText(error?.message) ||
        "用户管理操作失败。";

    const response = error?.context;

    if (
        response &&
        typeof response.clone === "function"
    ) {
        try {
            const payload =
                await response.clone().json();

            if (payload?.error) {
                message = normalizeText(
                    payload.error
                );
            }
        } catch {
            // 响应不是 JSON 时保留原始错误信息。
        }
    }

    return message;
}

async function invokeManageUsers(
    action,
    payload = {}
) {
    ensureConfigured();

    const {
        data,
        error
    } =
        await supabaseClient.functions
            .invoke(
                FUNCTION_NAME,
                {
                    body: {
                        action,
                        ...payload
                    }
                }
            );

    if (error) {
        throw new Error(
            await readFunctionError(error)
        );
    }

    if (data?.error) {
        throw new Error(
            normalizeText(data.error)
        );
    }

    return data ?? {};
}

export async function loadManagedUsers() {
    const result =
        await invokeManageUsers("list");

    return Array.isArray(result.users)
        ? result.users
        : [];
}

export async function banManagedUser({
    userId,
    banType,
    days = null,
    reason
}) {
    return invokeManageUsers(
        "ban",
        {
            userId,
            banType,
            days,
            reason
        }
    );
}

export async function unbanManagedUser(
    userId
) {
    return invokeManageUsers(
        "unban",
        { userId }
    );
}

export async function scheduleManagedUserDeletion({
    userId,
    reason
}) {
    return invokeManageUsers(
        "schedule-deletion",
        {
            userId,
            reason
        }
    );
}

export async function restoreManagedUserDeletion(
    userId
) {
    return invokeManageUsers(
        "restore-deletion",
        { userId }
    );
}

export async function permanentlyDeleteManagedUser(
    userId
) {
    return invokeManageUsers(
        "delete-user",
        { userId }
    );
}
