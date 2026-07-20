import {
    deleteAdminContentImage,
    getAdminIdentity,
    loadAdminContents,
    permanentlyDeleteAdminContent,
    restoreAdminContent,
    saveAdminContent,
    softDeleteAdminContent,
    uploadAdminContentImage,
    validateAdminImageFile
} from "./admin-content-service.js";

import {
    banManagedUser,
    loadManagedUsers,
    permanentlyDeleteManagedUser,
    restoreManagedUserDeletion,
    scheduleManagedUserDeletion,
    unbanManagedUser
} from "./admin-user-service.js";

const TYPE_LABELS = Object.freeze({
    works: "代表作品",
    articles: "作品赏析",
    gallery: "历史影像"
});

const STATUS_LABELS = Object.freeze({
    draft: "草稿",
    published: "已发布"
});

const USER_STATUS_LABELS = Object.freeze({
    active: "正常",
    banned: "已封禁",
    pending_deletion: "待删除"
});

const BAN_TYPE_LABELS = Object.freeze({
    temporary: "临时封禁",
    permanent: "永久封禁"
});

const state = {
    contents: [],
    trash: [],
    activePanel: "contents",
    editingId: "",
    contentFilter: "all",
    statusFilter: "all",
    keyword: "",
    imagePreviewUrl: "",
    users: [],
    usersLoaded: false,
    usersLoading: false,
    userStatusFilter: "all",
    userKeyword: ""
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

    if (panelName === "users") {
        void ensureUsersLoaded();
    }
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
        ),
        createElement(
            "p",
            "admin-content-summary",
            `稳定编号：${item.slug}`
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

    const permanentDeleteButton =
        createElement(
            "button",
            "admin-action-button danger",
            "永久删除"
        );

    permanentDeleteButton.type =
        "button";

    permanentDeleteButton.addEventListener(
        "click",
        () => {
            void handlePermanentDelete(
                item,
                permanentDeleteButton
            );
        }
    );

    actions.append(
        restoreButton,
        permanentDeleteButton
    );

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


function getFilteredUsers() {
    const keyword =
        state.userKeyword.toLowerCase();

    return state.users.filter(
        (user) => {
            const matchesStatus =
                state.userStatusFilter ===
                    "all" ||
                user.account_status ===
                    state.userStatusFilter;

            const haystack = [
                user.nickname,
                user.email,
                user.role,
                USER_STATUS_LABELS[
                    user.account_status
                ]
            ]
                .join(" ")
                .toLowerCase();

            return (
                matchesStatus &&
                (
                    !keyword ||
                    haystack.includes(keyword)
                )
            );
        }
    );
}

function updateUserOverview() {
    const values = {
        "[data-user-overview-total]":
            state.users.length,
        "[data-user-overview-active]":
            state.users.filter(
                (user) =>
                    user.account_status ===
                    "active"
            ).length,
        "[data-user-overview-banned]":
            state.users.filter(
                (user) =>
                    user.account_status ===
                    "banned"
            ).length,
        "[data-user-overview-pending]":
            state.users.filter(
                (user) =>
                    user.account_status ===
                    "pending_deletion"
            ).length
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

function createUserBadge(
    text,
    {
        role = "",
        status = ""
    } = {}
) {
    const badge =
        createElement(
            "span",
            "admin-user-badge",
            text
        );

    if (role) {
        badge.dataset.role = role;
    }

    if (status) {
        badge.dataset.status = status;
    }

    return badge;
}

function createUserMetaRow(
    label,
    value
) {
    const row =
        createElement(
            "div",
            "admin-user-meta-row"
        );

    row.append(
        createElement("dt", "", label),
        createElement(
            "dd",
            "",
            value || "—"
        )
    );

    return row;
}

function getUserStatusDescription(user) {
    if (
        user.account_status ===
        "banned"
    ) {
        const type =
            BAN_TYPE_LABELS[
                user.ban_type
            ] || "封禁";

        const until =
            user.ban_type ===
            "temporary"
                ? `，截止 ${formatDate(
                    user.banned_until
                )}`
                : "";

        return `${type}${until}。原因：${
            user.ban_reason || "未填写"
        }`;
    }

    if (
        user.account_status ===
        "pending_deletion"
    ) {
        return `账号已停用，最早可于 ${formatDate(
            user.deletion_effective_after
        )} 永久删除。原因：${
            user.deletion_reason || "未填写"
        }`;
    }

    if (user.is_current_admin) {
        return "这是当前登录的管理员账号，不能在此面板中操作。";
    }

    if (user.role === "admin") {
        return "管理员账号受保护，不能在用户管理面板中封禁或删除。";
    }

    return "账号状态正常。";
}

function createUserActionButton(
    text,
    className,
    handler
) {
    const button =
        createElement(
            "button",
            `admin-action-button${
                className
                    ? ` ${className}`
                    : ""
            }`,
            text
        );

    button.type = "button";
    button.addEventListener(
        "click",
        () => {
            void handler(button);
        }
    );

    return button;
}

async function runUserAction(
    button,
    pendingText,
    action,
    successMessage
) {
    const originalText =
        button.textContent;

    button.disabled = true;
    button.textContent = pendingText;

    try {
        await action();
        await reloadUsers();
        showToast(successMessage);
    } catch (error) {
        console.error(
            "User management failed:",
            error
        );

        button.disabled = false;
        button.textContent = originalText;

        showToast(
            error?.message ||
            "用户管理操作失败，请稍后重试。",
            true
        );
    }
}

function promptReason(title) {
    const reason =
        window.prompt(
            `${title}\n请输入处理原因（1～300字）：`,
            ""
        );

    if (reason === null) {
        return null;
    }

    const normalized = reason.trim();

    if (
        normalized.length < 1 ||
        normalized.length > 300
    ) {
        showToast(
            "处理原因必须为 1～300 个字符。",
            true
        );

        return null;
    }

    return normalized;
}

async function handleTemporaryUserBan(
    user,
    button
) {
    const daysText =
        window.prompt(
            `临时封禁《${
                user.nickname || user.email
            }》\n请输入封禁天数（1～365）：`,
            "7"
        );

    if (daysText === null) {
        return;
    }

    const days = Number(daysText.trim());

    if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > 365
    ) {
        showToast(
            "临时封禁天数必须是 1～365 的整数。",
            true
        );

        return;
    }

    const reason =
        promptReason("临时封禁账号");

    if (!reason) {
        return;
    }

    await runUserAction(
        button,
        "正在封禁……",
        () =>
            banManagedUser({
                userId: user.id,
                banType: "temporary",
                days,
                reason
            }),
        `《${user.nickname || user.email}》已临时封禁 ${days} 天`
    );
}

async function handlePermanentUserBan(
    user,
    button
) {
    const reason =
        promptReason("永久封禁账号");

    if (!reason) {
        return;
    }

    const confirmed =
        window.confirm(
            `确定永久封禁《${
                user.nickname || user.email
            }》吗？该账号将无法登录，管理员仍可稍后解封。`
        );

    if (!confirmed) {
        return;
    }

    await runUserAction(
        button,
        "正在封禁……",
        () =>
            banManagedUser({
                userId: user.id,
                banType: "permanent",
                reason
            }),
        `《${user.nickname || user.email}》已永久封禁`
    );
}

async function handleUserUnban(
    user,
    button
) {
    const confirmed =
        window.confirm(
            `确定解封《${
                user.nickname || user.email
            }》吗？`
        );

    if (!confirmed) {
        return;
    }

    await runUserAction(
        button,
        "正在解封……",
        () => unbanManagedUser(user.id),
        `《${user.nickname || user.email}》已解封`
    );
}

async function handleScheduleUserDeletion(
    user,
    button
) {
    const reason =
        promptReason("将账号设为待删除");

    if (!reason) {
        return;
    }

    const confirmed =
        window.confirm(
            `确定停用《${
                user.nickname || user.email
            }》并进入七天待删除状态吗？七天内可以恢复。`
        );

    if (!confirmed) {
        return;
    }

    await runUserAction(
        button,
        "正在停用……",
        () =>
            scheduleManagedUserDeletion({
                userId: user.id,
                reason
            }),
        `《${user.nickname || user.email}》已进入七天待删除状态`
    );
}

async function handleRestoreUserDeletion(
    user,
    button
) {
    const confirmed =
        window.confirm(
            `确定恢复《${
                user.nickname || user.email
            }》吗？恢复后账号可以重新登录。`
        );

    if (!confirmed) {
        return;
    }

    await runUserAction(
        button,
        "正在恢复……",
        () =>
            restoreManagedUserDeletion(
                user.id
            ),
        `《${user.nickname || user.email}》已恢复`
    );
}

async function handlePermanentUserDelete(
    user,
    button
) {
    const effectiveTime =
        Date.parse(
            user.deletion_effective_after ||
            ""
        );

    if (
        !Number.isFinite(effectiveTime) ||
        Date.now() < effectiveTime
    ) {
        showToast(
            `七天等待期尚未结束，最早可于 ${formatDate(
                user.deletion_effective_after
            )} 永久删除。`,
            true
        );

        return;
    }

    const expected =
        user.nickname || user.email;

    const confirmation =
        window.prompt(
            `永久删除将移除该账号、资料、收藏和留言，且无法恢复。\n请输入“${expected}”确认：`,
            ""
        );

    if (confirmation === null) {
        return;
    }

    if (confirmation.trim() !== expected) {
        showToast(
            "确认文字不一致，已取消永久删除。",
            true
        );

        return;
    }

    await runUserAction(
        button,
        "正在永久删除……",
        () =>
            permanentlyDeleteManagedUser(
                user.id
            ),
        `《${expected}》已永久删除`
    );
}

function createUserCard(user) {
    const card =
        createElement(
            "article",
            "admin-user-card"
        );

    card.dataset.accountStatus =
        user.account_status || "active";

    const badges =
        createElement(
            "div",
            "admin-user-badges"
        );

    badges.append(
        createUserBadge(
            user.role === "admin"
                ? "管理员"
                : "普通用户",
            { role: user.role }
        ),
        createUserBadge(
            USER_STATUS_LABELS[
                user.account_status
            ] || user.account_status,
            {
                status:
                    user.account_status
            }
        )
    );

    if (user.is_current_admin) {
        badges.append(
            createUserBadge(
                "当前账号"
            )
        );
    }

    const metadata =
        createElement(
            "dl",
            "admin-user-meta"
        );

    metadata.append(
        createUserMetaRow(
            "邮箱验证",
            user.email_confirmed_at
                ? "已验证"
                : "未验证"
        ),
        createUserMetaRow(
            "注册时间",
            formatDate(
                user.auth_created_at
            )
        ),
        createUserMetaRow(
            "最近登录",
            formatDate(
                user.last_sign_in_at
            )
        )
    );

    const notice =
        createElement(
            "div",
            "admin-user-notice",
            getUserStatusDescription(user)
        );

    const actions =
        createElement(
            "div",
            "admin-user-actions"
        );

    const protectedAccount =
        user.is_current_admin ||
        user.role === "admin";

    if (!protectedAccount) {
        if (
            user.account_status ===
            "active"
        ) {
            actions.append(
                createUserActionButton(
                    "临时封禁",
                    "warning",
                    (button) =>
                        handleTemporaryUserBan(
                            user,
                            button
                        )
                ),
                createUserActionButton(
                    "永久封禁",
                    "danger",
                    (button) =>
                        handlePermanentUserBan(
                            user,
                            button
                        )
                ),
                createUserActionButton(
                    "设为待删除",
                    "danger",
                    (button) =>
                        handleScheduleUserDeletion(
                            user,
                            button
                        )
                )
            );
        } else if (
            user.account_status ===
            "banned"
        ) {
            actions.append(
                createUserActionButton(
                    "解封账号",
                    "",
                    (button) =>
                        handleUserUnban(
                            user,
                            button
                        )
                )
            );
        } else if (
            user.account_status ===
            "pending_deletion"
        ) {
            const deleteButton =
                createUserActionButton(
                    "永久删除",
                    "danger",
                    (button) =>
                        handlePermanentUserDelete(
                            user,
                            button
                        )
                );

            const effectiveTime =
                Date.parse(
                    user.deletion_effective_after ||
                    ""
                );

            if (
                !Number.isFinite(effectiveTime) ||
                Date.now() < effectiveTime
            ) {
                deleteButton.disabled = true;
                deleteButton.title =
                    `等待期结束时间：${formatDate(
                        user.deletion_effective_after
                    )}`;
            }

            actions.append(
                createUserActionButton(
                    "恢复账号",
                    "",
                    (button) =>
                        handleRestoreUserDeletion(
                            user,
                            button
                        )
                ),
                deleteButton
            );
        }
    }

    card.append(
        badges,
        createElement(
            "h3",
            "admin-user-title",
            user.nickname || "未设置昵称"
        ),
        createElement(
            "div",
            "admin-user-email",
            user.email || "未提供邮箱"
        ),
        metadata,
        notice
    );

    if (actions.childElementCount > 0) {
        card.append(actions);
    }

    return card;
}

function renderUsers() {
    const list =
        getElement(
            "[data-admin-user-list]"
        );

    const count =
        getElement(
            "[data-admin-user-count]"
        );

    if (!list) {
        return;
    }

    updateUserOverview();

    const users = getFilteredUsers();

    if (count) {
        count.textContent =
            String(users.length);
    }

    if (users.length === 0) {
        const message =
            state.users.length === 0
                ? "当前项目还没有可显示的注册用户。"
                : "当前筛选条件下没有用户。";

        list.replaceChildren(
            createElement(
                "div",
                "admin-placeholder",
                message
            )
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    users.forEach((user) => {
        fragment.append(
            createUserCard(user)
        );
    });

    list.replaceChildren(fragment);
}

async function reloadUsers() {
    if (state.usersLoading) {
        return;
    }

    const list =
        getElement(
            "[data-admin-user-list]"
        );

    state.usersLoading = true;

    if (list) {
        list.replaceChildren(
            createElement(
                "div",
                "admin-placeholder",
                "正在读取用户列表……"
            )
        );
    }

    try {
        state.users =
            await loadManagedUsers();
        state.usersLoaded = true;
        renderUsers();
    } catch (error) {
        console.error(
            "User list failed:",
            error
        );

        state.usersLoaded = false;

        if (list) {
            list.replaceChildren(
                createElement(
                    "div",
                    "admin-placeholder",
                    error?.message ||
                    "用户列表读取失败，请稍后重试。"
                )
            );
        }

        showToast(
            error?.message ||
            "用户列表读取失败，请稍后重试。",
            true
        );
    } finally {
        state.usersLoading = false;
    }
}

async function ensureUsersLoaded() {
    if (
        state.usersLoaded ||
        state.usersLoading
    ) {
        return;
    }

    await reloadUsers();
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


async function handlePermanentDelete(
    item,
    button
) {
    const firstConfirmed =
        window.confirm(
            [
                `确定永久删除《${item.title}》吗？`,
                "",
                "此操作不可恢复，并会同时删除：",
                "1. 对应的收藏记录",
                "2. Supabase Storage 中的内容图片",
                "3. 数据库中的内容记录"
            ].join("\n")
        );

    if (!firstConfirmed) {
        return;
    }

    const typedSlug =
        window.prompt(
            [
                "请输入以下稳定编号，进行第二次确认：",
                item.slug
            ].join("\n"),
            ""
        );

    if (typedSlug === null) {
        return;
    }

    if (
        typedSlug.trim() !==
        item.slug
    ) {
        showToast(
            "稳定编号不匹配，已取消永久删除。",
            true
        );

        return;
    }

    button.disabled = true;
    button.textContent =
        "正在永久删除……";

    try {
        const result =
            await permanentlyDeleteAdminContent(
                item.id
            );

        await reloadData();

        showToast(
            `《${
                result.deletedTitle ||
                item.title
            }》已永久删除`
        );
    } catch (error) {
        console.error(
            "Permanent delete failed:",
            error
        );

        button.disabled = false;
        button.textContent =
            "永久删除";

        showToast(
            error?.message ||
            "永久删除失败，请稍后重试。",
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

    const userStatusFilter =
        getElement(
            "[data-user-status-filter]"
        );

    const userKeyword =
        getElement(
            "[data-user-keyword]"
        );

    const userRefresh =
        getElement(
            "[data-user-refresh]"
        );

    userStatusFilter?.addEventListener(
        "change",
        () => {
            state.userStatusFilter =
                userStatusFilter.value;
            renderUsers();
        }
    );

    userKeyword?.addEventListener(
        "input",
        () => {
            state.userKeyword =
                userKeyword.value.trim();
            renderUsers();
        }
    );

    userRefresh?.addEventListener(
        "click",
        () => {
            state.usersLoaded = false;
            void reloadUsers();
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
