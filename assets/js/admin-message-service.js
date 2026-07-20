import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

const FUNCTION_NAME =
    "moderate-messages";

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
        "留言管理操作失败。";

    const response = error?.context;

    if (
        response &&
        typeof response.clone ===
            "function"
    ) {
        try {
            const payload =
                await response
                    .clone()
                    .json();

            if (payload?.error) {
                message =
                    normalizeText(
                        payload.error
                    );
            }
        } catch {
            // 响应不是 JSON 时保留原始错误。
        }
    }

    return message;
}

async function invokeModerateMessages(
    action,
    payload = {}
) {
    ensureConfigured();

    const {
        data,
        error
    } =
        await supabaseClient
            .functions
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
            await readFunctionError(
                error
            )
        );
    }

    if (data?.error) {
        throw new Error(
            normalizeText(
                data.error
            )
        );
    }

    return data ?? {};
}

export async function loadManagedMessages() {
    const result =
        await invokeModerateMessages(
            "list"
        );

    return {
        messages:
            Array.isArray(
                result.messages
            )
                ? result.messages
                : [],
        counts:
            result.counts &&
            typeof result.counts ===
                "object"
                ? result.counts
                : {
                    total: 0,
                    visible: 0,
                    hidden: 0
                }
    };
}

export async function loadMessageModerationLogs(
    limit = 100
) {
    const result =
        await invokeModerateMessages(
            "list-logs",
            { limit }
        );

    return {
        logs:
            Array.isArray(result.logs)
                ? result.logs
                : []
    };
}

export async function moderateManagedMessage({
    messageId,
    action,
    reason
}) {
    return invokeModerateMessages(
        action,
        {
            messageId,
            reason
        }
    );
}
