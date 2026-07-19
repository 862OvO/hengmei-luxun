import {
    withSupabase
} from "npm:@supabase/server@^1";

const CONTENT_IMAGES_BUCKET =
    "content-images";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        readClaim(
            userClaims,
            "sub"
        ) ||
        readClaim(
            userClaims,
            "id"
        ) ||
        readClaim(
            jwtClaims,
            "sub"
        )
    );
}

function extractStoragePath(
    imagePath: string | null
): string | null {
    if (!imagePath) {
        return null;
    }

    const cleanPath =
        imagePath
            .split("?")[0]
            .trim();

    const publicMarker =
        "/storage/v1/object/public/" +
        CONTENT_IMAGES_BUCKET +
        "/";

    const markerIndex =
        cleanPath.indexOf(
            publicMarker
        );

    if (markerIndex >= 0) {
        const encodedPath =
            cleanPath.slice(
                markerIndex +
                publicMarker.length
            );

        try {
            return decodeURIComponent(
                encodedPath
            );
        } catch {
            return encodedPath;
        }
    }

    /*
     * 兼容数据库中直接保存的 Storage 相对路径。
     * 本地 assets 路径和外部 URL 不执行删除。
     */
    if (
        !cleanPath.includes("://") &&
        !cleanPath.startsWith(
            "assets/"
        )
    ) {
        return cleanPath.replace(
            /^\/+/,
            ""
        );
    }

    return null;
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

            let requestBody:
                Record<string, unknown>;

            try {
                requestBody =
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

            const contentId =
                typeof requestBody
                    .contentId ===
                "string"
                    ? requestBody
                        .contentId
                        .trim()
                    : "";

            if (
                !UUID_PATTERN.test(
                    contentId
                )
            ) {
                return Response.json(
                    {
                        error:
                            "内容编号格式不正确。"
                    },
                    {
                        status: 400
                    }
                );
            }

            const {
                data: profile,
                error: profileError
            } =
                await context
                    .supabaseAdmin
                    .from("profiles")
                    .select("role")
                    .eq("id", userId)
                    .maybeSingle();

            if (profileError) {
                console.error(
                    "Administrator check failed:",
                    profileError
                );

                return Response.json(
                    {
                        error:
                            "管理员身份检查失败。"
                    },
                    {
                        status: 500
                    }
                );
            }

            if (
                profile?.role !==
                "admin"
            ) {
                return Response.json(
                    {
                        error:
                            "当前账号没有管理员权限。"
                    },
                    {
                        status: 403
                    }
                );
            }

            const {
                data: content,
                error: contentError
            } =
                await context
                    .supabaseAdmin
                    .from("contents")
                    .select(
                        [
                            "id",
                            "title",
                            "image_path",
                            "deleted_at"
                        ].join(",")
                    )
                    .eq(
                        "id",
                        contentId
                    )
                    .maybeSingle();

            if (contentError) {
                console.error(
                    "Content lookup failed:",
                    contentError
                );

                return Response.json(
                    {
                        error:
                            "读取待删除内容失败。"
                    },
                    {
                        status: 500
                    }
                );
            }

            if (!content) {
                return Response.json(
                    {
                        error:
                            "没有找到对应内容。"
                    },
                    {
                        status: 404
                    }
                );
            }

            if (!content.deleted_at) {
                return Response.json(
                    {
                        error:
                            "只有回收站中的内容才能永久删除。"
                    },
                    {
                        status: 409
                    }
                );
            }

            const storagePath =
                extractStoragePath(
                    content.image_path
                );

            if (storagePath) {
                const {
                    error: storageError
                } =
                    await context
                        .supabaseAdmin
                        .storage
                        .from(
                            CONTENT_IMAGES_BUCKET
                        )
                        .remove([
                            storagePath
                        ]);

                if (storageError) {
                    console.error(
                        "Storage deletion failed:",
                        storageError
                    );

                    return Response.json(
                        {
                            error:
                                "图片删除失败，内容尚未永久删除。"
                        },
                        {
                            status: 500
                        }
                    );
                }
            }

            const {
                data: deletedContent,
                error: deleteError
            } =
                await context
                    .supabaseAdmin
                    .from("contents")
                    .delete()
                    .eq(
                        "id",
                        contentId
                    )
                    .select(
                        "id, title"
                    )
                    .maybeSingle();

            if (deleteError) {
                console.error(
                    "Content deletion failed:",
                    deleteError
                );

                return Response.json(
                    {
                        error:
                            "数据库内容永久删除失败。"
                    },
                    {
                        status: 500
                    }
                );
            }

            if (!deletedContent) {
                return Response.json(
                    {
                        error:
                            "删除操作没有影响任何内容。"
                    },
                    {
                        status: 409
                    }
                );
            }

            return Response.json({
                success: true,
                deletedContentId:
                    deletedContent.id,
                deletedTitle:
                    deletedContent.title,
                deletedStoragePath:
                    storagePath
            });
        }
    )
};