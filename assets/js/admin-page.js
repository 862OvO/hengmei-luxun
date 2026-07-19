import {
    deleteAdminContentImage,
    getAdminIdentity,
    loadAdminContents,
    restoreAdminContent,
    saveAdminContent,
    softDeleteAdminContent,
    uploadAdminContentImage,
    validateAdminImageFile
} from "./admin-content-service.js";

const TYPE_LABELS = Object.freeze({
    works: "代表作品",
    articles: "作品赏析",
    gallery: "历史影像"
});

const STATUS_LABELS = Object.freeze({
    draft: "草稿",
    published: "已发布"
});

const state = {
    contents: [],
    trash: [],
    activePanel: "contents",
    editingId: "",
    contentFilter: "all",
    statusFilter: "all",
    keyword: "",
    imagePreviewUrl: ""
};

let toastTimer = null;

function getElement(selector) {
    return document.querySelector(selector);
}

function createElement(
    tagName,
    className,
    textContent
) {
    const element =
        document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (textContent !== undefined) {
        element.textContent = textContent;
    }

    return element;
}

function showToast(
    message,
    isError = false
) {
    const toast =
        getElement("[data-admin-toast]");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.dataset.type =
        isError
            ? "error"
            : "success";
    toast.hidden = false;

    window.clearTimeout(toastTimer);

    toastTimer =
        window.setTimeout(
            () => {
                toast.hidden = true;
            },
            3200
        );
}

function redirectToLogin() {
    const returnTo = "admin.html";

    sessionStorage.setItem(
        "authReturnPath",
        returnTo
    );

    window.location.replace(
        "auth.html?returnTo=" +
        encodeURIComponent(returnTo)
    );
}

function showDenied(message) {
    const loading =
        getElement("[data-admin-loading]");

    const denied =
        getElement("[data-admin-denied]");

    const deniedMessage =
        getElement(
            "[data-admin-denied-message]"
        );

    const app =
        getElement("[data-admin-app]");

    if (loading) {
        loading.hidden = true;
    }

    if (app) {
        app.hidden = true;
    }

    if (deniedMessage) {
        deniedMessage.textContent =
            message;
    }

    if (denied) {
        denied.hidden = false;
    }
}

function showAdminApp(profile) {
    const loading =
        getElement("[data-admin-loading]");

    const denied =
        getElement("[data-admin-denied]");

    const app =
        getElement("[data-admin-app]");

    const nickname =
        getElement("[data-admin-nickname]");

    if (loading) {
        loading.hidden = true;
    }

    if (denied) {
        denied.hidden = true;
    }

    if (nickname) {
        nickname.textContent =
            profile.nickname ||
            "管理员";
    }

    if (app) {
        app.hidden = false;
    }
}

function activatePanel(panelName) {
    state.activePanel = panelName;

    document
        .querySelectorAll(
            "[data-admin-tab]"
        )
        .forEach((button) => {
            const isActive =
                button.dataset.adminTab ===
                panelName;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-selected",
                String(isActive)
            );
        });

    document
        .querySelectorAll(
            "[data-admin-panel]"
        )
        .forEach((panel) => {
            panel.hidden =
                panel.dataset.adminPanel !==
                panelName;
        });
}

function initializeTabs() {
    document
        .querySelectorAll(
            "[data-admin-tab]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    activatePanel(
                        button.dataset.adminTab
                    );
                }
            );
        });

    activatePanel("contents");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "zh-CN",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}

function getFilteredContents() {
    const keyword =
        state.keyword.toLowerCase();

    return state.contents.filter(
        (item) => {
            const matchesType =
                state.contentFilter ===
                    "all" ||
                item.content_type ===
                    state.contentFilter;

            const matchesStatus =
                state.statusFilter ===
                    "all" ||
                item.status ===
                    state.statusFilter;

            const haystack = [
                item.title,
                item.slug,
                item.summary,
                JSON.stringify(
                    item.metadata ?? {}
                )
            ]
                .join(" ")
                .toLowerCase();

            const matchesKeyword =
                !keyword ||
                haystack.includes(keyword);

            return (
                matchesType &&
                matchesStatus &&
                matchesKeyword
            );
        }
    );
}

function createStatusBadge(status) {
    const badge =
        createElement(
            "span",
            "admin-status-badge",
            STATUS_LABELS[status] ||
            status
        );

    badge.dataset.status = status;

    return badge;
}

function createTypeBadge(type) {
    return createElement(
        "span",
        "admin-type-badge",
        TYPE_LABELS[type] || type
    );
}

function createContentCard(item) {
    const card =
        createElement(
            "article",
            "admin-content-card"
        );

    const header =
        createElement(
            "div",
            "admin-content-card-header"
        );

    const badges =
        createElement(
            "div",
            "admin-card-badges"
        );

    badges.append(
        createTypeBadge(
            item.content_type
        ),
        createStatusBadge(item.status)
    );

    const title =
        createElement(
            "h3",
            "admin-content-title",
            item.title
        );

    header.append(
        badges,
        title
    );

    const details =
        createElement(
            "dl",
            "admin-content-meta"
        );

    [
        ["稳定编号", item.slug],
        ["排序", String(item.sort_order)],
        ["更新时间", formatDate(item.updated_at)]
    ].forEach(([label, value]) => {
        const row =
            createElement(
                "div",
                "admin-content-meta-row"
            );

        row.append(
            createElement("dt", "", label),
            createElement("dd", "", value)
        );

        details.append(row);
    });

    const summary =
        createElement(
            "p",
            "admin-content-summary",
            item.summary ||
            "暂无摘要"
        );

    const actions =
        createElement(
            "div",
            "admin-content-actions"
        );

    const preview =
        createElement(
            "a",
            "admin-action-link",
            "查看详情"
        );

    preview.href =
        `detail.html?type=${encodeURIComponent(
            item.content_type
        )}&id=${encodeURIComponent(
            item.slug
        )}`;

    preview.target = "_blank";
    preview.rel = "noopener";

    const editButton =
        createElement(
            "button",
            "admin-action-button",
            "编辑"
        );

    editButton.type = "button";
    editButton.addEventListener(
        "click",
        () => {
            startEditing(item);
        }
    );

    const deleteButton =
        createElement(
            "button",
            "admin-action-button danger",
            "移入回收站"
        );

    deleteButton.type = "button";
    deleteButton.addEventListener(
        "click",
        () => {
            void handleSoftDelete(
                item,
                deleteButton
            );
        }
    );

    actions.append(
        preview,
        editButton,
        deleteButton
    );

    card.append(
        header,
        details,
        summary,
        actions
    );

    return card;
}

function renderContents() {
    const list =
        getElement(
            "[data-admin-content-list]"
        );

    const count =
        getElement(
            "[data-admin-content-count]"
        );

    if (!list) {
        return;
    }

    const items =
        getFilteredContents();

    if (count) {
        count.textContent =
            String(items.length);
    }

    if (items.length === 0) {
        const empty =
            createElement(
                "div",
                "admin-placeholder",
                "当前筛选条件下没有内容。"
            );

        list.replaceChildren(empty);
        return;
    }

    const fragment =
        document.createDocumentFragment();

    items.forEach((item) => {
        fragment.append(
            createContentCard(item)
        );
    });

    list.replaceChildren(fragment);
}

function createTrashCard(item) {
    const card =
        createElement(
            "article",
            "admin-content-card trash"
        );

    card.append(
        createTypeBadge(
            item.content_type
        ),
        createElement(
            "h3",
            "admin-content-title",
            item.title
        ),
        createElement(
            "p",
            "admin-content-summary",
            `删除时间：${formatDate(
                item.deleted_at
            )}`
        )
    );

    const actions =
        createElement(
            "div",
            "admin-content-actions"
        );

    const restoreButton =
        createElement(
            "button",
            "admin-action-button",
            "恢复内容"
        );

    restoreButton.type = "button";
    restoreButton.addEventListener(
        "click",
        () => {
            void handleRestore(
                item,
                restoreButton
            );
        }
    );

    actions.append(restoreButton);
    card.append(actions);

    return card;
}

function renderTrash() {
    const list =
        getElement(
            "[data-admin-trash-list]"
        );

    const count =
        getElement(
            "[data-admin-trash-count]"
        );

    if (!list) {
        return;
    }

    if (count) {
        count.textContent =
            String(state.trash.length);
    }

    if (state.trash.length === 0) {
        const empty =
            createElement(
                "div",
                "admin-placeholder",
                "回收站中没有内容。"
            );

        list.replaceChildren(empty);
        return;
    }

    const fragment =
        document.createDocumentFragment();

    state.trash.forEach((item) => {
        fragment.append(
            createTrashCard(item)
        );
    });

    list.replaceChildren(fragment);
}

function updateOverview() {
    const total = state.contents.length;
    const published =
        state.contents.filter(
            (item) =>
                item.status ===
                "published"
        ).length;
    const drafts = total - published;

    const values = {
        "[data-overview-total]": total,
        "[data-overview-published]": published,
        "[data-overview-drafts]": drafts,
        "[data-overview-trash]": state.trash.length
    };

    Object.entries(values)
        .forEach(
            ([selector, value]) => {
                const element =
                    getElement(selector);

                if (element) {
                    element.textContent =
                        String(value);
                }
            }
        );
}


function revokeImagePreviewUrl() {
    if (!state.imagePreviewUrl) {
        return;
    }

    URL.revokeObjectURL(
        state.imagePreviewUrl
    );

    state.imagePreviewUrl = "";
}

function renderImagePreview(
    source = "",
    alt = "内容图片预览"
) {
    const image =
        getElement(
            "[data-image-preview-image]"
        );

    const placeholder =
        getElement(
            "[data-image-preview-placeholder]"
        );

    if (!image || !placeholder) {
        return;
    }

    if (!source) {
        image.hidden = true;
        image.removeAttribute("src");
        placeholder.hidden = false;
        placeholder.textContent =
            "尚未选择图片";
        return;
    }

    image.hidden = false;
    image.src = source;
    image.alt = alt;
    placeholder.hidden = true;
}

function resetImageEditor() {
    revokeImagePreviewUrl();

    const fileInput =
        getElement(
            "[data-field-image-file]"
        );

    const removeInput =
        getElement(
            "[data-field-image-remove]"
        );

    const imagePathInput =
        getElement(
            "[data-field-image]"
        );

    if (fileInput) {
        fileInput.value = "";
    }

    if (removeInput) {
        removeInput.checked = false;
    }

    if (imagePathInput) {
        imagePathInput.value = "";
    }

    renderImagePreview();
}

function loadCurrentImagePreview(
    imagePath,
    title = "内容图片预览"
) {
    revokeImagePreviewUrl();

    const fileInput =
        getElement(
            "[data-field-image-file]"
        );

    const removeInput =
        getElement(
            "[data-field-image-remove]"
        );

    if (fileInput) {
        fileInput.value = "";
    }

    if (removeInput) {
        removeInput.checked = false;
    }

    renderImagePreview(
        imagePath || "",
        title
    );
}

function initializeImageEditor() {
    const fileInput =
        getElement(
            "[data-field-image-file]"
        );

    const removeInput =
        getElement(
            "[data-field-image-remove]"
        );

    const imagePathInput =
        getElement(
            "[data-field-image]"
        );

    fileInput?.addEventListener(
        "change",
        () => {
            const file =
                fileInput.files?.[0];

            revokeImagePreviewUrl();

            if (!file) {
                renderImagePreview(
                    imagePathInput?.value || ""
                );
                return;
            }

            try {
                validateAdminImageFile(file);
            } catch (error) {
                fileInput.value = "";

                renderImagePreview(
                    imagePathInput?.value || ""
                );

                showToast(
                    error?.message ||
                    "图片文件不符合要求。",
                    true
                );

                return;
            }

            if (removeInput) {
                removeInput.checked = false;
            }

            state.imagePreviewUrl =
                URL.createObjectURL(file);

            renderImagePreview(
                state.imagePreviewUrl,
                file.name
            );
        }
    );

    removeInput?.addEventListener(
        "change",
        () => {
            if (removeInput.checked) {
                revokeImagePreviewUrl();

                if (fileInput) {
                    fileInput.value = "";
                }

                renderImagePreview();
                return;
            }

            renderImagePreview(
                imagePathInput?.value || ""
            );
        }
    );
}

function resetEditorForm() {
    const form =
        getElement("[data-admin-form]");

    if (!form) {
        return;
    }

    form.reset();
    state.editingId = "";
    resetImageEditor();

    const idInput =
        getElement("[data-field-id]");

    const metadata =
        getElement(
            "[data-field-metadata]"
        );

    const heading =
        getElement(
            "[data-editor-heading]"
        );

    const submit =
        getElement(
            "[data-admin-submit]"
        );

    if (idInput) {
        idInput.value = "";
    }

    if (metadata) {
        metadata.value = "{}";
    }

    if (heading) {
        heading.textContent =
            "新增内容";
    }

    if (submit) {
        submit.textContent =
            "保存内容";
    }
}

function startEditing(item) {
    state.editingId = item.id;

    const values = {
        "[data-field-id]": item.id,
        "[data-field-type]":
            item.content_type,
        "[data-field-slug]": item.slug,
        "[data-field-title]": item.title,
        "[data-field-summary]":
            item.summary,
        "[data-field-body]": item.body,
        "[data-field-image]":
            item.image_path || "",
        "[data-field-status]": item.status,
        "[data-field-sort]":
            String(item.sort_order),
        "[data-field-metadata]":
            JSON.stringify(
                item.metadata ?? {},
                null,
                2
            )
    };

    Object.entries(values)
        .forEach(
            ([selector, value]) => {
                const field =
                    getElement(selector);

                if (field) {
                    field.value = value;
                }
            }
        );

    loadCurrentImagePreview(
        item.image_path || "",
        item.title
    );

    const heading =
        getElement(
            "[data-editor-heading]"
        );

    const submit =
        getElement(
            "[data-admin-submit]"
        );

    if (heading) {
        heading.textContent =
            `编辑：${item.title}`;
    }

    if (submit) {
        submit.textContent =
            "更新内容";
    }

    activatePanel("editor");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function readEditorInput() {
    const metadataText =
        getElement(
            "[data-field-metadata]"
        )?.value.trim() ||
        "{}";

    let metadata;

    try {
        metadata =
            JSON.parse(metadataText);
    } catch {
        throw new Error(
            "专属字段必须是合法的 JSON 对象。"
        );
    }

    if (
        !metadata ||
        typeof metadata !== "object" ||
        Array.isArray(metadata)
    ) {
        throw new Error(
            "专属字段必须是 JSON 对象，不能是数组。"
        );
    }

    return {
        id:
            getElement(
                "[data-field-id]"
            )?.value || "",
        content_type:
            getElement(
                "[data-field-type]"
            )?.value || "",
        slug:
            getElement(
                "[data-field-slug]"
            )?.value || "",
        title:
            getElement(
                "[data-field-title]"
            )?.value || "",
        summary:
            getElement(
                "[data-field-summary]"
            )?.value || "",
        body:
            getElement(
                "[data-field-body]"
            )?.value || "",
        image_path:
            getElement(
                "[data-field-image]"
            )?.value || "",
        image_file:
            getElement(
                "[data-field-image-file]"
            )?.files?.[0] || null,
        remove_image:
            Boolean(
                getElement(
                    "[data-field-image-remove]"
                )?.checked
            ),
        status:
            getElement(
                "[data-field-status]"
            )?.value || "",
        sort_order:
            getElement(
                "[data-field-sort]"
            )?.value || "0",
        metadata
    };
}

async function reloadData() {
    const [contents, trash] =
        await Promise.all([
            loadAdminContents(),
            loadAdminContents({
                deleted: true
            })
        ]);

    state.contents = contents;
    state.trash = trash;

    renderContents();
    renderTrash();
    updateOverview();
}

async function handleSubmit(event) {
    event.preventDefault();

    const submit =
        getElement(
            "[data-admin-submit]"
        );

    if (submit) {
        submit.disabled = true;
        submit.textContent =
            "正在保存……";
    }

    let uploadedImage = null;
    let originalImagePath = "";

    try {
        const input =
            readEditorInput();

        originalImagePath =
            input.image_path || "";

        if (input.image_file) {
            uploadedImage =
                await uploadAdminContentImage(
                    input.image_file,
                    {
                        contentType:
                            input.content_type,
                        slug:
                            input.slug
                    }
                );

            input.image_path =
                uploadedImage.publicUrl;
        } else if (
            input.remove_image
        ) {
            input.image_path = "";
        }

        delete input.image_file;
        delete input.remove_image;

        const saved =
            await saveAdminContent(input);

        if (
            originalImagePath &&
            originalImagePath !==
                saved.image_path
        ) {
            try {
                await deleteAdminContentImage(
                    originalImagePath
                );
            } catch (cleanupError) {
                console.warn(
                    "Old image cleanup failed:",
                    cleanupError
                );
            }
        }

        await reloadData();
        resetEditorForm();
        activatePanel("contents");

        showToast(
            input.id
                ? `已更新《${saved.title}》`
                : `已创建《${saved.title}》`
        );
    } catch (error) {
        if (uploadedImage?.publicUrl) {
            try {
                await deleteAdminContentImage(
                    uploadedImage.publicUrl
                );
            } catch (rollbackError) {
                console.warn(
                    "Uploaded image rollback failed:",
                    rollbackError
                );
            }
        }

        console.error(
            "Admin save failed:",
            error
        );

        const message =
            error?.code === "23505"
                ? "同一分类下已经存在相同的稳定编号。"
                : (
                    error?.message ||
                    "保存失败，请稍后重试。"
                );

        showToast(message, true);
    } finally {
        if (submit) {
            submit.disabled = false;
            submit.textContent =
                state.editingId
                    ? "更新内容"
                    : "保存内容";
        }
    }
}

async function handleSoftDelete(
    item,
    button
) {
    const confirmed =
        window.confirm(
            `确定把《${item.title}》移入回收站吗？`
        );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent =
        "正在处理……";

    try {
        await softDeleteAdminContent(
            item.id
        );

        await reloadData();

        showToast(
            `《${item.title}》已移入回收站`
        );
    } catch (error) {
        console.error(
            "Soft delete failed:",
            error
        );

        button.disabled = false;
        button.textContent =
            "移入回收站";

        showToast(
            "移入回收站失败，请稍后重试。",
            true
        );
    }
}

async function handleRestore(
    item,
    button
) {
    button.disabled = true;
    button.textContent =
        "正在恢复……";

    try {
        await restoreAdminContent(
            item.id
        );

        await reloadData();

        showToast(
            `《${item.title}》已恢复`
        );
    } catch (error) {
        console.error(
            "Restore failed:",
            error
        );

        button.disabled = false;
        button.textContent =
            "恢复内容";

        showToast(
            "恢复失败，请稍后重试。",
            true
        );
    }
}

function initializeFilters() {
    const typeFilter =
        getElement(
            "[data-content-filter]"
        );

    const statusFilter =
        getElement(
            "[data-status-filter]"
        );

    const keyword =
        getElement(
            "[data-admin-keyword]"
        );

    typeFilter?.addEventListener(
        "change",
        () => {
            state.contentFilter =
                typeFilter.value;
            renderContents();
        }
    );

    statusFilter?.addEventListener(
        "change",
        () => {
            state.statusFilter =
                statusFilter.value;
            renderContents();
        }
    );

    keyword?.addEventListener(
        "input",
        () => {
            state.keyword =
                keyword.value.trim();
            renderContents();
        }
    );
}

function initializeEditor() {
    initializeImageEditor();

    const form =
        getElement("[data-admin-form]");

    const reset =
        getElement("[data-admin-reset]");

    const createButton =
        getElement("[data-admin-create]");

    form?.addEventListener(
        "submit",
        handleSubmit
    );

    reset?.addEventListener(
        "click",
        resetEditorForm
    );

    createButton?.addEventListener(
        "click",
        () => {
            resetEditorForm();
            activatePanel("editor");
        }
    );

    resetEditorForm();
}

async function initializeAdminPage() {
    initializeTabs();
    initializeFilters();
    initializeEditor();

    try {
        const { user, profile } =
            await getAdminIdentity();

        if (!user) {
            redirectToLogin();
            return;
        }

        showAdminApp(profile);
        await reloadData();
    } catch (error) {
        console.error(
            "Admin authorization failed:",
            error
        );

        if (
            error?.message ===
            "当前尚未登录。"
        ) {
            redirectToLogin();
            return;
        }

        showDenied(
            error?.message ||
            "管理员身份验证失败，请刷新页面后重试。"
        );
    }
}

initializeAdminPage();
