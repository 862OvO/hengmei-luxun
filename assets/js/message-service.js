import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

export const MESSAGE_PAGE_SIZE = 10;

function ensureConfigured() {
    if (!isSupabaseConfigured()) {
        throw new Error(
            "Supabase 尚未正确配置。"
        );
    }
}

function normalizeMessageContent(content) {
    const value =
        String(content ?? "").trim();

    if (!value) {
        throw new Error(
            "留言内容不能为空。"
        );
    }

    if (value.length > 500) {
        throw new Error(
            "留言内容不能超过 500 字。"
        );
    }

    return value;
}

function normalizePage(page) {
    const numericPage = Number(page);

    if (
        !Number.isInteger(numericPage) ||
        numericPage < 1
    ) {
        return 1;
    }

    return numericPage;
}

export async function getMessageBoardUser() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data, error } =
        await supabaseClient.auth
            .getSession();

    if (error) {
        throw error;
    }

    return data.session?.user ?? null;
}

export async function loadPublicMessages(
    page = 1,
    pageSize = MESSAGE_PAGE_SIZE
) {
    ensureConfigured();

    const safePage = normalizePage(page);
    const safePageSize = Math.max(
        1,
        Math.min(
            50,
            Number(pageSize) ||
            MESSAGE_PAGE_SIZE
        )
    );

    const from =
        (safePage - 1) *
        safePageSize;

    const to =
        from +
        safePageSize - 1;

    const { data, count, error } =
        await supabaseClient
            .from("public_message_cards")
            .select(
                "message_id,nickname,content,created_at,updated_at,is_edited,is_owner",
                {
                    count: "exact"
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .range(from, to);

    if (error) {
        throw error;
    }

    return {
        data: data ?? [],
        count: count ?? 0,
        page: safePage,
        pageSize: safePageSize
    };
}

export async function createMessage(content) {
    ensureConfigured();

    const user =
        await getMessageBoardUser();

    if (!user) {
        return {
            requiresLogin: true
        };
    }

    const safeContent =
        normalizeMessageContent(content);

    const { error } =
        await supabaseClient
            .from("messages")
            .insert({
                user_id: user.id,
                content: safeContent
            });

    if (error) {
        throw error;
    }

    return {
        requiresLogin: false
    };
}

export async function updateMessage(
    messageId,
    content
) {
    ensureConfigured();

    const user =
        await getMessageBoardUser();

    if (!user) {
        return {
            requiresLogin: true
        };
    }

    const safeMessageId =
        String(messageId ?? "").trim();

    const safeContent =
        normalizeMessageContent(content);

    if (!safeMessageId) {
        throw new Error(
            "缺少留言编号。"
        );
    }

    const { data, error } =
        await supabaseClient
            .from("messages")
            .update({
                content: safeContent
            })
            .eq("id", safeMessageId)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error(
            "留言不存在或无权编辑。"
        );
    }

    return {
        requiresLogin: false
    };
}

export async function deleteMessage(
    messageId
) {
    ensureConfigured();

    const user =
        await getMessageBoardUser();

    if (!user) {
        return {
            requiresLogin: true
        };
    }

    const safeMessageId =
        String(messageId ?? "").trim();

    if (!safeMessageId) {
        throw new Error(
            "缺少留言编号。"
        );
    }

    const { data, error } =
        await supabaseClient
            .from("messages")
            .delete()
            .eq("id", safeMessageId)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error(
            "留言不存在或无权删除。"
        );
    }

    return {
        requiresLogin: false
    };
}
