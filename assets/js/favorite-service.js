import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

const PENDING_FAVORITE_KEY =
    "hengmeiPendingFavorite";

const AUTH_RETURN_KEY =
    "authReturnPath";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeContentId(
    contentId
) {
    const value =
        String(contentId ?? "").trim();

    return UUID_PATTERN.test(value)
        ? value
        : "";
}

function ensureConfigured() {
    if (!isSupabaseConfigured()) {
        throw new Error(
            "Supabase 尚未正确配置。"
        );
    }
}

export function getCurrentRelativeUrl() {
    const pathParts =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    const fileName =
        pathParts.at(-1) ||
        "index.html";

    return (
        fileName +
        window.location.search +
        window.location.hash
    );
}

export async function getCurrentUser() {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();

    if (error) {
        throw error;
    }

    return data.session?.user ?? null;
}

export async function getFavoriteContentIds(
    contentIds
) {
    ensureConfigured();

    const validIds =
        [...new Set(
            contentIds
                .map(normalizeContentId)
                .filter(Boolean)
        )];

    const user =
        await getCurrentUser();

    if (!user || validIds.length === 0) {
        return {
            user,
            favoriteIds: new Set()
        };
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("favorites")
            .select("content_id")
            .eq("user_id", user.id)
            .in("content_id", validIds);

    if (error) {
        throw error;
    }

    return {
        user,

        favoriteIds:
            new Set(
                (data ?? []).map(
                    (item) =>
                        item.content_id
                )
            )
    };
}

async function addFavorite(
    userId,
    contentId
) {
    const {
        error
    } =
        await supabaseClient
            .from("favorites")
            .insert({
                user_id: userId,
                content_id: contentId
            });

    /*
     * 23505 表示唯一约束冲突。
     * 已经收藏时将其视为成功，
     * 避免重复点击导致错误提示。
     */
    if (
        error &&
        error.code !== "23505"
    ) {
        throw error;
    }
}

async function removeFavorite(
    userId,
    contentId
) {
    const {
        error
    } =
        await supabaseClient
            .from("favorites")
            .delete()
            .eq("user_id", userId)
            .eq("content_id", contentId);

    if (error) {
        throw error;
    }
}

function savePendingFavorite(
    item
) {
    const contentId =
        normalizeContentId(
            item.contentId
        );

    if (!contentId) {
        return false;
    }

    const pendingData = {
        contentId,

        contentType:
            String(
                item.contentType ?? ""
            ),

        slug:
            String(item.slug ?? ""),

        title:
            String(item.title ?? ""),

        returnTo:
            getCurrentRelativeUrl()
    };

    sessionStorage.setItem(
        PENDING_FAVORITE_KEY,
        JSON.stringify(pendingData)
    );

    sessionStorage.setItem(
        AUTH_RETURN_KEY,
        pendingData.returnTo
    );

    return true;
}

function redirectToLogin(
    item
) {
    const saved =
        savePendingFavorite(item);

    if (!saved) {
        throw new Error(
            "当前内容缺少有效的数据库编号。"
        );
    }

    const returnTo =
        getCurrentRelativeUrl();

    window.location.assign(
        "auth.html?returnTo=" +
        encodeURIComponent(returnTo)
    );
}

export async function toggleFavorite(
    item,
    currentlyFavorite
) {
    ensureConfigured();

    const contentId =
        normalizeContentId(
            item.contentId
        );

    if (!contentId) {
        return {
            unavailable: true,
            redirected: false,
            isFavorite: false
        };
    }

    const user =
        await getCurrentUser();

    if (!user) {
        redirectToLogin({
            ...item,
            contentId
        });

        return {
            unavailable: false,
            redirected: true,
            isFavorite: false
        };
    }

    if (currentlyFavorite) {
        await removeFavorite(
            user.id,
            contentId
        );

        return {
            unavailable: false,
            redirected: false,
            isFavorite: false
        };
    }

    await addFavorite(
        user.id,
        contentId
    );

    return {
        unavailable: false,
        redirected: false,
        isFavorite: true
    };
}

export async function completePendingFavorite() {
    if (!isSupabaseConfigured()) {
        return {
            completed: false
        };
    }

    const rawValue =
        sessionStorage.getItem(
            PENDING_FAVORITE_KEY
        );

    if (!rawValue) {
        return {
            completed: false
        };
    }

    let pendingData;

    try {
        pendingData =
            JSON.parse(rawValue);
    } catch {
        sessionStorage.removeItem(
            PENDING_FAVORITE_KEY
        );

        return {
            completed: false
        };
    }

    const contentId =
        normalizeContentId(
            pendingData.contentId
        );

    if (!contentId) {
        sessionStorage.removeItem(
            PENDING_FAVORITE_KEY
        );

        return {
            completed: false
        };
    }

    const user =
        await getCurrentUser();

    if (!user) {
        return {
            completed: false
        };
    }

    await addFavorite(
        user.id,
        contentId
    );

    sessionStorage.removeItem(
        PENDING_FAVORITE_KEY
    );

    return {
        completed: true,
        contentId,
        title:
            pendingData.title || ""
    };
}

export async function loadMyFavoriteCards() {
    ensureConfigured();

    const user =
        await getCurrentUser();

    if (!user) {
        return {
            user: null,
            data: []
        };
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("my_favorite_cards")
            .select("*")
            .order(
                "favorited_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    return {
        user,
        data: data ?? []
    };
}