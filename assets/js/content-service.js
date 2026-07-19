import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

const CONTENT_CONFIG = Object.freeze({
    works: {
        label: "代表作品",
        localPath: "assets/data/works.json"
    },

    articles: {
        label: "作品赏析",
        localPath: "assets/data/articles.json"
    },

    gallery: {
        label: "历史影像",
        localPath: "assets/data/gallery.json"
    }
});

export const CONTENT_TYPES =
    Object.freeze(
        Object.keys(CONTENT_CONFIG)
    );

const CONTENT_SELECT_FIELDS = [
    "id",
    "content_type",
    "slug",
    "title",
    "summary",
    "body",
    "image_path",
    "metadata",
    "status",
    "sort_order",
    "published_at",
    "created_at",
    "updated_at"
].join(",");

function validateContentType(contentType) {
    if (!CONTENT_CONFIG[contentType]) {
        throw new Error(
            `不支持的内容类型：${contentType}`
        );
    }
}

function normalizeMetadata(metadata) {
    if (
        metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata)
    ) {
        return metadata;
    }

    return {};
}

function normalizeContent(item) {
    return {
        id: item.id ?? null,

        content_type:
            String(item.content_type ?? ""),

        slug:
            String(item.slug ?? ""),

        title:
            String(item.title ?? ""),

        summary:
            String(item.summary ?? ""),

        body:
            String(item.body ?? ""),

        image_path:
            item.image_path
                ? String(item.image_path)
                : null,

        metadata:
            normalizeMetadata(item.metadata),

        status:
            String(
                item.status ?? "published"
            ),

        sort_order:
            Number.isFinite(
                Number(item.sort_order)
            )
                ? Number(item.sort_order)
                : 0,

        published_at:
            item.published_at ?? null,

        created_at:
            item.created_at ?? null,

        updated_at:
            item.updated_at ?? null
    };
}

function sortContents(contents) {
    return [...contents].sort(
        (first, second) => {
            const orderDifference =
                first.sort_order -
                second.sort_order;

            if (orderDifference !== 0) {
                return orderDifference;
            }

            return first.title.localeCompare(
                second.title,
                "zh-CN"
            );
        }
    );
}

async function loadLocalContents(
    contentType
) {
    validateContentType(contentType);

    const response = await fetch(
        CONTENT_CONFIG[contentType]
            .localPath,
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `本地数据读取失败：HTTP ${response.status}`
        );
    }

    const sourceData =
        await response.json();

    if (!Array.isArray(sourceData)) {
        throw new Error(
            "本地内容数据格式不正确。"
        );
    }

    const contents =
        sourceData
            .filter(
                (item) =>
                    item.content_type ===
                        contentType &&
                    item.status ===
                        "published"
            )
            .map(normalizeContent);

    return sortContents(contents);
}

async function loadSupabaseContents(
    contentType
) {
    const { data, error } =
        await supabaseClient
            .from("contents")
            .select(
                CONTENT_SELECT_FIELDS
            )
            .eq(
                "content_type",
                contentType
            )
            .eq(
                "status",
                "published"
            )
            .is(
                "deleted_at",
                null
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map(normalizeContent);
}

export function getContentTypeLabel(
    contentType
) {
    validateContentType(contentType);

    return CONTENT_CONFIG[
        contentType
    ].label;
}

export function getContentDetailUrl(
    item
) {
    const contentType =
        encodeURIComponent(
            item.content_type
        );

    const slug =
        encodeURIComponent(
            item.slug
        );

    return (
        `detail.html?type=${contentType}` +
        `&id=${slug}`
    );
}

export async function loadPublishedContents(
    contentType
) {
    validateContentType(contentType);

    if (isSupabaseConfigured()) {
        try {
            const data =
                await loadSupabaseContents(
                    contentType
                );

            return {
                data,
                source: "supabase",
                usedFallback: false,
                warning: null
            };
        } catch (error) {
            console.warn(
                `Supabase ${contentType} 数据读取失败，正在使用本地备用数据：`,
                error?.message
            );
        }
    }

    const data =
        await loadLocalContents(
            contentType
        );

    return {
        data,
        source: "local",
        usedFallback: true,
        warning:
            "当前正在使用本地备用数据，收藏与后台更新可能暂不可用。"
    };
}

async function loadSupabaseContentBySlug(
    contentType,
    slug
) {
    const { data, error } =
        await supabaseClient
            .from("contents")
            .select(
                CONTENT_SELECT_FIELDS
            )
            .eq(
                "content_type",
                contentType
            )
            .eq(
                "slug",
                slug
            )
            .eq(
                "status",
                "published"
            )
            .is(
                "deleted_at",
                null
            )
            .maybeSingle();

    if (error) {
        throw error;
    }

    return data
        ? normalizeContent(data)
        : null;
}

export async function loadContentBySlug(
    contentType,
    slug
) {
    validateContentType(contentType);

    const safeSlug =
        String(slug ?? "").trim();

    if (!safeSlug) {
        return {
            data: null,
            source: "none",
            usedFallback: false,
            warning: null
        };
    }

    if (isSupabaseConfigured()) {
        try {
            const data =
                await loadSupabaseContentBySlug(
                    contentType,
                    safeSlug
                );

            return {
                data,
                source: "supabase",
                usedFallback: false,
                warning: null
            };
        } catch (error) {
            console.warn(
                "Supabase 详情读取失败，正在使用本地备用数据：",
                error?.message
            );
        }
    }

    const localContents =
        await loadLocalContents(
            contentType
        );

    const data =
        localContents.find(
            (item) =>
                item.slug === safeSlug
        ) ?? null;

    return {
        data,
        source: "local",
        usedFallback: true,
        warning:
            "当前正在使用本地备用数据，收藏与后台更新可能暂不可用。"
    };
}

export async function loadAllPublishedContents() {
    const results =
        await Promise.all(
            CONTENT_TYPES.map(
                (contentType) =>
                    loadPublishedContents(
                        contentType
                    )
            )
        );

    const data =
        results.flatMap(
            (result) =>
                result.data
        );

    return {
        data,
        usedFallback:
            results.some(
                (result) =>
                    result.usedFallback
            ),

        sources:
            Object.fromEntries(
                CONTENT_TYPES.map(
                    (
                        contentType,
                        index
                    ) => [
                        contentType,
                        results[index].source
                    ]
                )
            )
    };
}