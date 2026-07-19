import {
    isSupabaseConfigured,
    supabaseClient
} from "./supabase-client.js";

const CONTENT_TYPES = new Set([
    "works",
    "articles",
    "gallery"
]);

const CONTENT_STATUSES = new Set([
    "draft",
    "published"
]);

const CONTENT_IMAGE_BUCKET =
    "content-images";

const MAX_IMAGE_FILE_SIZE =
    5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]);

const IMAGE_EXTENSIONS =
    Object.freeze({
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    });

const SLUG_PATTERN =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CONTENT_FIELDS = [
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
    "deleted_at",
    "created_at",
    "updated_at"
].join(",");

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

function normalizeMetadata(value) {
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value;
    }

    return {};
}

function normalizeContent(item) {
    return {
        id: item.id,
        content_type: item.content_type,
        slug: item.slug,
        title: item.title,
        summary: item.summary ?? "",
        body: item.body ?? "",
        image_path: item.image_path ?? "",
        metadata: normalizeMetadata(
            item.metadata
        ),
        status: item.status,
        sort_order: Number(
            item.sort_order ?? 0
        ),
        published_at:
            item.published_at ?? null,
        deleted_at:
            item.deleted_at ?? null,
        created_at:
            item.created_at ?? null,
        updated_at:
            item.updated_at ?? null
    };
}

async function requireCurrentAdmin() {
    ensureConfigured();

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth
            .getSession();

    if (sessionError) {
        throw sessionError;
    }

    const user =
        sessionData.session?.user;

    if (!user) {
        throw new Error(
            "当前尚未登录。"
        );
    }

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select("nickname, role")
            .eq("id", user.id)
            .maybeSingle();

    if (profileError) {
        throw profileError;
    }

    if (
        !profile ||
        profile.role !== "admin"
    ) {
        throw new Error(
            "当前账号没有管理员权限。"
        );
    }

    return {
        user,
        profile
    };
}

function validateContentInput(input) {
    const contentType =
        normalizeText(
            input.content_type
        );

    const status =
        normalizeText(input.status);

    const slug =
        normalizeText(input.slug);

    const title =
        normalizeText(input.title);

    if (!CONTENT_TYPES.has(contentType)) {
        throw new Error(
            "请选择正确的内容分类。"
        );
    }

    if (!CONTENT_STATUSES.has(status)) {
        throw new Error(
            "请选择正确的发布状态。"
        );
    }

    if (!SLUG_PATTERN.test(slug)) {
        throw new Error(
            "稳定编号只能使用小写英文字母、数字和单个连字符。"
        );
    }

    if (!title) {
        throw new Error(
            "内容标题不能为空。"
        );
    }

    const sortOrder =
        Number(input.sort_order);

    if (!Number.isInteger(sortOrder)) {
        throw new Error(
            "排序值必须是整数。"
        );
    }

    return {
        content_type: contentType,
        slug,
        title,
        summary:
            normalizeText(input.summary),
        body:
            normalizeText(input.body),
        image_path:
            normalizeText(input.image_path) ||
            null,
        metadata:
            normalizeMetadata(
                input.metadata
            ),
        status,
        sort_order: sortOrder
    };
}


function createUniqueImageName(
    file,
    contentType,
    slug
) {
    const extension =
        IMAGE_EXTENSIONS[file.type];

    const randomPart =
        globalThis.crypto?.randomUUID?.() ||
        Math.random()
            .toString(36)
            .slice(2);

    return [
        contentType,
        slug,
        `${Date.now()}-${randomPart}.${extension}`
    ].join("/");
}

function getStorageObjectPath(
    imagePath
) {
    const value =
        normalizeText(imagePath);

    if (!value) {
        return "";
    }

    const marker =
        `/storage/v1/object/public/${CONTENT_IMAGE_BUCKET}/`;

    const markerIndex =
        value.indexOf(marker);

    if (markerIndex === -1) {
        return "";
    }

    const encodedPath =
        value.slice(
            markerIndex +
            marker.length
        );

    try {
        return decodeURIComponent(
            encodedPath
        );
    } catch {
        return encodedPath;
    }
}

export function validateAdminImageFile(
    file
) {
    if (!(file instanceof File)) {
        throw new Error(
            "请选择需要上传的图片。"
        );
    }

    if (!ALLOWED_IMAGE_TYPES.has(
        file.type
    )) {
        throw new Error(
            "图片仅支持 JPEG、PNG 或 WebP 格式。"
        );
    }

    if (
        file.size <= 0 ||
        file.size >
            MAX_IMAGE_FILE_SIZE
    ) {
        throw new Error(
            "图片大小必须在 5 MB 以内。"
        );
    }

    return true;
}

export async function uploadAdminContentImage(
    file,
    {
        contentType,
        slug
    }
) {
    await requireCurrentAdmin();
    validateAdminImageFile(file);

    const normalizedContentType =
        normalizeText(contentType);

    const normalizedSlug =
        normalizeText(slug);

    if (
        !CONTENT_TYPES.has(
            normalizedContentType
        ) ||
        !SLUG_PATTERN.test(
            normalizedSlug
        )
    ) {
        throw new Error(
            "请先填写正确的内容分类和稳定编号。"
        );
    }

    const objectPath =
        createUniqueImageName(
            file,
            normalizedContentType,
            normalizedSlug
        );

    const {
        data: uploadData,
        error: uploadError
    } =
        await supabaseClient.storage
            .from(
                CONTENT_IMAGE_BUCKET
            )
            .upload(
                objectPath,
                file,
                {
                    cacheControl: "3600",
                    contentType:
                        file.type,
                    upsert: false
                }
            );

    if (uploadError) {
        throw uploadError;
    }

    const {
        data: publicUrlData
    } =
        supabaseClient.storage
            .from(
                CONTENT_IMAGE_BUCKET
            )
            .getPublicUrl(
                uploadData.path
            );

    const publicUrl =
        publicUrlData?.publicUrl;

    if (!publicUrl) {
        await supabaseClient.storage
            .from(
                CONTENT_IMAGE_BUCKET
            )
            .remove([
                uploadData.path
            ]);

        throw new Error(
            "图片上传成功，但无法生成公开地址。"
        );
    }

    return {
        path: uploadData.path,
        publicUrl
    };
}

export async function deleteAdminContentImage(
    imagePath
) {
    await requireCurrentAdmin();

    const objectPath =
        getStorageObjectPath(
            imagePath
        );

    if (!objectPath) {
        return {
            deleted: false
        };
    }

    const {
        error
    } =
        await supabaseClient.storage
            .from(
                CONTENT_IMAGE_BUCKET
            )
            .remove([
                objectPath
            ]);

    if (error) {
        throw error;
    }

    return {
        deleted: true,
        path: objectPath
    };
}

export async function getAdminIdentity() {
    return requireCurrentAdmin();
}

export async function loadAdminContents({
    deleted = false
} = {}) {
    await requireCurrentAdmin();

    let query =
        supabaseClient
            .from("contents")
            .select(CONTENT_FIELDS)
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );

    query = deleted
        ? query.not(
            "deleted_at",
            "is",
            null
        )
        : query.is(
            "deleted_at",
            null
        );

    const { data, error } =
        await query;

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map(normalizeContent);
}

export async function saveAdminContent(
    input
) {
    const { user } =
        await requireCurrentAdmin();

    const payload =
        validateContentInput(input);

    const contentId =
        normalizeText(input.id);

    if (!contentId) {
        const insertPayload = {
            ...payload,
            created_by: user.id,
            updated_by: user.id,
            published_at:
                payload.status ===
                "published"
                    ? new Date()
                        .toISOString()
                    : null
        };

        const { data, error } =
            await supabaseClient
                .from("contents")
                .insert(insertPayload)
                .select(CONTENT_FIELDS)
                .single();

        if (error) {
            throw error;
        }

        return normalizeContent(data);
    }

    const {
        data: existing,
        error: existingError
    } =
        await supabaseClient
            .from("contents")
            .select("published_at")
            .eq("id", contentId)
            .maybeSingle();

    if (existingError) {
        throw existingError;
    }

    if (!existing) {
        throw new Error(
            "未找到需要编辑的内容。"
        );
    }

    const updatePayload = {
        ...payload,
        updated_by: user.id,
        published_at:
            payload.status ===
            "published"
                ? (
                    existing.published_at ||
                    new Date()
                        .toISOString()
                )
                : null
    };

    const { data, error } =
        await supabaseClient
            .from("contents")
            .update(updatePayload)
            .eq("id", contentId)
            .select(CONTENT_FIELDS)
            .single();

    if (error) {
        throw error;
    }

    return normalizeContent(data);
}

export async function softDeleteAdminContent(
    contentId
) {
    const { user } =
        await requireCurrentAdmin();

    const { error } =
        await supabaseClient
            .from("contents")
            .update({
                deleted_at:
                    new Date()
                        .toISOString(),
                updated_by: user.id
            })
            .eq("id", contentId);

    if (error) {
        throw error;
    }
}

export async function restoreAdminContent(
    contentId
) {
    const { user } =
        await requireCurrentAdmin();

    const { error } =
        await supabaseClient
            .from("contents")
            .update({
                deleted_at: null,
                updated_by: user.id
            })
            .eq("id", contentId);

    if (error) {
        throw error;
    }
}
