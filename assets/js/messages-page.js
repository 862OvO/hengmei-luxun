import {
    MESSAGE_PAGE_SIZE,
    createMessage,
    deleteMessage,
    getMessageBoardUser,
    loadPublicMessages,
    updateMessage
} from "./message-service.js";

const state = {
    user: null,
    items: [],
    page: 1,
    pageSize: MESSAGE_PAGE_SIZE,
    totalCount: 0,
    isLoading: false
};

let toastTimer = null;

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

function getElements() {
    return {
        composer:
            document.querySelector(
                "[data-message-composer]"
            ),

        composerStatus:
            document.querySelector(
                "[data-composer-status]"
            ),

        form:
            document.querySelector(
                "[data-message-form]"
            ),

        textarea:
            document.querySelector(
                "[data-message-input]"
            ),

        counter:
            document.querySelector(
                "[data-message-counter]"
            ),

        submitButton:
            document.querySelector(
                "[data-message-submit]"
            ),

        loginLink:
            document.querySelector(
                "[data-message-login]"
            ),

        list:
            document.querySelector(
                "[data-message-list]"
            ),

        total:
            document.querySelector(
                "[data-message-total]"
            ),

        pagination:
            document.querySelector(
                "[data-message-pagination]"
            )
    };
}

function getPageFromUrl() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const page =
        Number(parameters.get("page"));

    return (
        Number.isInteger(page) &&
        page > 0
    )
        ? page
        : 1;
}

function updatePageUrl(page) {
    const url =
        new URL(window.location.href);

    if (page <= 1) {
        url.searchParams.delete("page");
    } else {
        url.searchParams.set(
            "page",
            String(page)
        );
    }

    window.history.replaceState(
        {},
        "",
        url
    );
}

function redirectToLogin() {
    const returnTo =
        "messages.html" +
        window.location.search;

    sessionStorage.setItem(
        "authReturnPath",
        returnTo
    );

    window.location.assign(
        "auth.html?returnTo=" +
        encodeURIComponent(returnTo)
    );
}

function showToast(
    message,
    isError = false
) {
    let toast =
        document.querySelector(
            "[data-message-toast]"
        );

    if (!toast) {
        toast = createElement(
            "div",
            "message-toast"
        );

        toast.dataset.messageToast = "";
        toast.setAttribute(
            "role",
            "status"
        );
        toast.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.append(toast);
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

function formatDate(value) {
    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "时间未知";
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

function updateComposer(elements) {
    if (state.user) {
        elements.composerStatus.textContent =
            "已登录。留言发布后将立即公开显示。";

        elements.form.hidden = false;
        elements.loginLink.hidden = true;
        elements.textarea.disabled = false;
        elements.submitButton.disabled = false;
        return;
    }

    elements.composerStatus.textContent =
        "访客可以浏览留言，登录后即可发布。";

    elements.form.hidden = true;
    elements.loginLink.hidden = false;
}

function updateCounter(elements) {
    const length =
        elements.textarea.value.length;

    elements.counter.textContent =
        `${length} / 500`;

    elements.counter.dataset.limit =
        length >= 480
            ? "near"
            : "normal";
}

function renderState(
    elements,
    title,
    message
) {
    const stateElement =
        createElement(
            "div",
            "message-state"
        );

    stateElement.append(
        createElement(
            "strong",
            "",
            title
        ),
        createElement(
            "span",
            "",
            message
        )
    );

    elements.list.replaceChildren(
        stateElement
    );
}

function createEditForm(
    item,
    card,
    contentElement
) {
    const form =
        createElement(
            "form",
            "message-edit-form"
        );

    const textarea =
        document.createElement("textarea");

    textarea.className =
        "message-edit-input";
    textarea.maxLength = 500;
    textarea.rows = 5;
    textarea.value = item.content;
    textarea.setAttribute(
        "aria-label",
        "编辑留言内容"
    );

    const footer =
        createElement(
            "div",
            "message-edit-footer"
        );

    const counter =
        createElement(
            "span",
            "message-edit-counter",
            `${textarea.value.length} / 500`
        );

    const actions =
        createElement(
            "div",
            "message-edit-actions"
        );

    const cancelButton =
        createElement(
            "button",
            "message-action-button",
            "取消"
        );

    cancelButton.type = "button";

    const saveButton =
        createElement(
            "button",
            "message-action-button primary",
            "保存修改"
        );

    saveButton.type = "submit";

    textarea.addEventListener(
        "input",
        () => {
            counter.textContent =
                `${textarea.value.length} / 500`;
        }
    );

    cancelButton.addEventListener(
        "click",
        () => {
            form.replaceWith(
                contentElement
            );
        }
    );

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const content =
                textarea.value.trim();

            if (!content) {
                showToast(
                    "留言内容不能为空。",
                    true
                );
                textarea.focus();
                return;
            }

            saveButton.disabled = true;
            cancelButton.disabled = true;
            textarea.disabled = true;
            saveButton.textContent =
                "保存中…";

            try {
                const result =
                    await updateMessage(
                        item.message_id,
                        content
                    );

                if (result.requiresLogin) {
                    redirectToLogin();
                    return;
                }

                showToast(
                    "留言修改成功。"
                );

                await loadAndRenderMessages();
            } catch (error) {
                console.error(
                    "Update message failed:",
                    error
                );

                showToast(
                    error?.message ||
                    "留言修改失败。",
                    true
                );

                saveButton.disabled = false;
                cancelButton.disabled = false;
                textarea.disabled = false;
                saveButton.textContent =
                    "保存修改";
            }
        }
    );

    actions.append(
        cancelButton,
        saveButton
    );

    footer.append(
        counter,
        actions
    );

    form.append(
        textarea,
        footer
    );

    contentElement.replaceWith(form);
    textarea.focus();
    textarea.setSelectionRange(
        textarea.value.length,
        textarea.value.length
    );
}

async function handleDelete(
    item,
    button
) {
    const confirmed =
        window.confirm(
            "确定删除这条留言吗？此操作不能撤销。"
        );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = "删除中…";

    try {
        const result =
            await deleteMessage(
                item.message_id
            );

        if (result.requiresLogin) {
            redirectToLogin();
            return;
        }

        if (
            state.items.length === 1 &&
            state.page > 1
        ) {
            state.page -= 1;
        }

        showToast(
            "留言已删除。"
        );

        await loadAndRenderMessages();
    } catch (error) {
        console.error(
            "Delete message failed:",
            error
        );

        showToast(
            error?.message ||
            "留言删除失败。",
            true
        );

        button.disabled = false;
        button.textContent = "删除";
    }
}

function createMessageCard(item) {
    const card =
        createElement(
            "article",
            "message-card"
        );

    const header =
        createElement(
            "header",
            "message-card-header"
        );

    const author =
        createElement(
            "div",
            "message-author"
        );

    const avatar =
        createElement(
            "span",
            "message-avatar",
            String(
                item.nickname || "访"
            ).slice(0, 1)
        );

    const authorText =
        createElement(
            "div",
            "message-author-text"
        );

    authorText.append(
        createElement(
            "strong",
            "",
            item.nickname || "未命名用户"
        ),
        createElement(
            "span",
            "",
            formatDate(item.created_at)
        )
    );

    author.append(
        avatar,
        authorText
    );

    const badges =
        createElement(
            "div",
            "message-badges"
        );

    if (item.is_edited) {
        badges.append(
            createElement(
                "span",
                "message-badge",
                "已编辑"
            )
        );
    }

    if (item.is_owner) {
        badges.append(
            createElement(
                "span",
                "message-badge owner",
                "我的留言"
            )
        );
    }

    header.append(
        author,
        badges
    );

    const content =
        createElement(
            "p",
            "message-content",
            item.content
        );

    card.append(
        header,
        content
    );

    if (item.is_owner) {
        const actions =
            createElement(
                "div",
                "message-card-actions"
            );

        const editButton =
            createElement(
                "button",
                "message-action-button",
                "编辑"
            );

        editButton.type = "button";

        const deleteButton =
            createElement(
                "button",
                "message-action-button danger",
                "删除"
            );

        deleteButton.type = "button";

        editButton.addEventListener(
            "click",
            () => {
                createEditForm(
                    item,
                    card,
                    content
                );
            }
        );

        deleteButton.addEventListener(
            "click",
            () => {
                handleDelete(
                    item,
                    deleteButton
                );
            }
        );

        actions.append(
            editButton,
            deleteButton
        );

        card.append(actions);
    }

    return card;
}

function renderPagination(elements) {
    const totalPages =
        Math.max(
            1,
            Math.ceil(
                state.totalCount /
                state.pageSize
            )
        );

    elements.pagination.replaceChildren();

    if (
        state.totalCount <=
        state.pageSize
    ) {
        elements.pagination.hidden = true;
        return;
    }

    elements.pagination.hidden = false;

    const previousButton =
        createElement(
            "button",
            "message-page-button",
            "上一页"
        );

    previousButton.type = "button";
    previousButton.disabled =
        state.page <= 1;

    const pageStatus =
        createElement(
            "span",
            "message-page-status",
            `第 ${state.page} / ${totalPages} 页`
        );

    const nextButton =
        createElement(
            "button",
            "message-page-button",
            "下一页"
        );

    nextButton.type = "button";
    nextButton.disabled =
        state.page >= totalPages;

    previousButton.addEventListener(
        "click",
        async () => {
            if (state.page <= 1) {
                return;
            }

            state.page -= 1;
            await loadAndRenderMessages();
            window.scrollTo({
                top:
                    elements.list
                        .getBoundingClientRect()
                        .top +
                    window.scrollY -
                    120,
                behavior: "smooth"
            });
        }
    );

    nextButton.addEventListener(
        "click",
        async () => {
            if (state.page >= totalPages) {
                return;
            }

            state.page += 1;
            await loadAndRenderMessages();
            window.scrollTo({
                top:
                    elements.list
                        .getBoundingClientRect()
                        .top +
                    window.scrollY -
                    120,
                behavior: "smooth"
            });
        }
    );

    elements.pagination.append(
        previousButton,
        pageStatus,
        nextButton
    );
}

function renderMessages(elements) {
    elements.total.textContent =
        String(state.totalCount);

    if (state.items.length === 0) {
        renderState(
            elements,
            "还没有公开留言",
            "登录后发布第一条文化留言。"
        );

        renderPagination(elements);
        return;
    }

    const fragment =
        document.createDocumentFragment();

    state.items.forEach((item) => {
        fragment.append(
            createMessageCard(item)
        );
    });

    elements.list.replaceChildren(
        fragment
    );

    renderPagination(elements);
}

async function loadAndRenderMessages() {
    const elements = getElements();

    if (
        !elements.list ||
        state.isLoading
    ) {
        return;
    }

    state.isLoading = true;

    renderState(
        elements,
        "正在读取留言",
        "请稍候……"
    );

    try {
        const result =
            await loadPublicMessages(
                state.page,
                state.pageSize
            );

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    result.count /
                    state.pageSize
                )
            );

        if (state.page > totalPages) {
            state.page = totalPages;

            const correctedResult =
                await loadPublicMessages(
                    state.page,
                    state.pageSize
                );

            state.items =
                correctedResult.data;
            state.totalCount =
                correctedResult.count;
        } else {
            state.items = result.data;
            state.totalCount = result.count;
        }

        updatePageUrl(state.page);
        renderMessages(elements);
    } catch (error) {
        console.error(
            "Load messages failed:",
            error
        );

        renderState(
            elements,
            "留言读取失败",
            "请检查网络连接并刷新页面。"
        );

        showToast(
            "留言读取失败。",
            true
        );
    } finally {
        state.isLoading = false;
    }
}

function initializeComposer(elements) {
    elements.textarea.addEventListener(
        "input",
        () => {
            updateCounter(elements);
        }
    );

    elements.form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const content =
                elements.textarea
                    .value.trim();

            if (!content) {
                showToast(
                    "请输入留言内容。",
                    true
                );
                elements.textarea.focus();
                return;
            }

            elements.textarea.disabled = true;
            elements.submitButton.disabled = true;
            elements.submitButton.textContent =
                "发布中…";

            try {
                const result =
                    await createMessage(
                        content
                    );

                if (result.requiresLogin) {
                    redirectToLogin();
                    return;
                }

                elements.textarea.value = "";
                updateCounter(elements);
                state.page = 1;

                showToast(
                    "留言发布成功。"
                );

                await loadAndRenderMessages();
            } catch (error) {
                console.error(
                    "Create message failed:",
                    error
                );

                showToast(
                    error?.message ||
                    "留言发布失败。",
                    true
                );
            } finally {
                elements.textarea.disabled = false;
                elements.submitButton.disabled = false;
                elements.submitButton.textContent =
                    "发布留言";
            }
        }
    );

    elements.loginLink.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            redirectToLogin();
        }
    );
}

async function initializeMessagesPage() {
    const elements = getElements();

    if (
        !elements.composer ||
        !elements.form ||
        !elements.textarea ||
        !elements.list ||
        !elements.pagination
    ) {
        return;
    }

    state.page = getPageFromUrl();

    initializeComposer(elements);
    updateCounter(elements);

    try {
        state.user =
            await getMessageBoardUser();
    } catch (error) {
        console.error(
            "Message board session failed:",
            error
        );
        state.user = null;
    }

    updateComposer(elements);
    await loadAndRenderMessages();
}

initializeMessagesPage();
