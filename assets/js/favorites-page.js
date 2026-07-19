import {
    getContentDetailUrl,
    getContentTypeLabel
} from "./content-service.js";

import {
    getCurrentRelativeUrl,
    loadMyFavoriteCards,
    toggleFavorite
} from "./favorite-service.js";

const TYPE_LABELS = Object.freeze({
    all: "全部收藏",
    works: "代表作品",
    articles: "作品赏析",
    gallery: "历史影像"
});

const state = {
    items: [],
    activeType: "all"
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

function showToast(
    message,
    isError = false
) {
    let toast =
        document.querySelector(
            "[data-favorite-toast]"
        );

    if (!toast) {
        toast =
            createElement(
                "div",
                "favorite-toast"
            );

        toast.dataset.favoriteToast = "";

        toast.setAttribute(
            "role",
            "status"
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
            3000
        );
}

function redirectToLogin() {
    const returnTo =
        getCurrentRelativeUrl();

    sessionStorage.setItem(
        "authReturnPath",
        returnTo
    );

    window.location.replace(
        "auth.html?returnTo=" +
        encodeURIComponent(returnTo)
    );
}

function getMetadataItems(item) {
    const metadata =
        item.metadata ?? {};

    if (item.content_type === "works") {
        return [
            metadata.year,
            metadata.genre,
            metadata.collection
        ];
    }

    if (item.content_type === "articles") {
        return [
            metadata.related_work,
            metadata.analysis_focus,
            metadata.reading_time
        ];
    }

    if (item.content_type === "gallery") {
        return [
            metadata.category,
            metadata.display_date,
            metadata.location
        ];
    }

    return [];
}

function createMetadata(item) {
    const container =
        createElement(
            "div",
            "favorite-card-meta"
        );

    getMetadataItems(item)
        .filter(Boolean)
        .slice(0, 3)
        .forEach((value) => {
            container.append(
                createElement(
                    "span",
                    "",
                    String(value)
                )
            );
        });

    return container;
}

function createCardImage(item) {
    const wrapper =
        createElement(
            "div",
            "favorite-card-image"
        );

    const isPlaceholder =
        !item.image_path ||
        item.image_path.includes(
            "placeholder"
        );

    if (isPlaceholder) {
        wrapper.append(
            createElement(
                "span",
                "",
                item.metadata?.category
                    ? `${item.metadata.category}资料`
                    : getContentTypeLabel(
                        item.content_type
                    )
            )
        );
    } else {
        const image =
            document.createElement("img");

        image.src = item.image_path;

        image.alt =
            item.metadata?.alt ||
            item.title;

        image.addEventListener(
            "error",
            () => {
                image.remove();

                wrapper.prepend(
                    createElement(
                        "span",
                        "",
                        "图片资料暂不可用"
                    )
                );
            },
            {
                once: true
            }
        );

        wrapper.append(image);
    }

    wrapper.append(
        createElement(
            "span",
            "favorite-card-status",
            item.is_available
                ? "已收藏"
                : "内容已下架"
        )
    );

    return wrapper;
}

async function removeFavorite(
    item,
    button
) {
    button.disabled = true;
    button.textContent = "正在取消…";

    try {
        const result =
            await toggleFavorite(
                {
                    contentId:
                        item.content_id,

                    contentType:
                        item.content_type,

                    slug:
                        item.slug,

                    title:
                        item.title
                },
                true
            );

        if (result.isFavorite) {
            throw new Error(
                "收藏状态未正确取消。"
            );
        }

        state.items =
            state.items.filter(
                (currentItem) =>
                    currentItem
                        .favorite_id !==
                    item.favorite_id
            );

        renderPage();

        showToast(
            `已取消收藏《${item.title}》`
        );
    } catch (error) {
        console.error(
            "Remove favorite failed:",
            error
        );

        button.disabled = false;
        button.textContent = "取消收藏";

        showToast(
            "取消收藏失败，请稍后重试。",
            true
        );
    }
}

function createFavoriteCard(item) {
    const card =
        createElement(
            "article",
            "favorite-card"
        );

    if (!item.is_available) {
        card.classList.add(
            "unavailable"
        );
    }

    const content =
        createElement(
            "div",
            "favorite-card-content"
        );

    const actions =
        createElement(
            "div",
            "favorite-card-actions"
        );

    if (item.is_available) {
        const detailLink =
            createElement(
                "a",
                "favorite-card-link",
                "查看详情"
            );

        detailLink.href =
            getContentDetailUrl(item);

        actions.append(detailLink);
    } else {
        actions.append(
            createElement(
                "span",
                "favorite-card-link",
                "详情不可用"
            )
        );
    }

    const removeButton =
        createElement(
            "button",
            "favorite-remove-button",
            "取消收藏"
        );

    removeButton.type = "button";

    removeButton.addEventListener(
        "click",
        () => {
            removeFavorite(
                item,
                removeButton
            );
        }
    );

    actions.append(removeButton);

    content.append(
        createElement(
            "div",
            "favorite-card-type",
            getContentTypeLabel(
                item.content_type
            )
        ),

        createElement(
            "h2",
            "favorite-card-title",
            item.title
        ),

        createMetadata(item)
    );

    if (item.is_available) {
        content.append(
            createElement(
                "p",
                "favorite-card-summary",
                item.summary ||
                "相关内容正在整理中。"
            )
        );
    } else {
        content.append(
            createElement(
                "div",
                "favorite-card-unavailable",
                "该内容已下架，正文与详情入口暂不可用。"
            )
        );
    }

    content.append(actions);

    card.append(
        createCardImage(item),
        content
    );

    return card;
}

function getFilteredItems() {
    if (state.activeType === "all") {
        return state.items;
    }

    return state.items.filter(
        (item) =>
            item.content_type ===
            state.activeType
    );
}

function updateCounts() {
    document
        .querySelectorAll(
            "[data-favorite-total]"
        )
        .forEach((element) => {
            element.textContent =
                String(state.items.length);
        });

    document
        .querySelectorAll(
            "[data-favorite-tab]"
        )
        .forEach((button) => {
            const type =
                button.dataset.favoriteTab;

            const count =
                type === "all"
                    ? state.items.length
                    : state.items.filter(
                        (item) =>
                            item.content_type ===
                            type
                    ).length;

            const countElement =
                button.querySelector(
                    "[data-tab-count]"
                );

            if (countElement) {
                countElement.textContent =
                    String(count);
            }

            button.classList.toggle(
                "active",
                type === state.activeType
            );

            button.setAttribute(
                "aria-pressed",
                String(
                    type ===
                    state.activeType
                )
            );
        });
}

function renderState(
    title,
    message,
    showBrowseLink = false
) {
    const grid =
        document.querySelector(
            "[data-favorites-grid]"
        );

    const stateElement =
        createElement(
            "div",
            "favorites-state"
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

    if (showBrowseLink) {
        const link =
            createElement(
                "a",
                "",
                "前往代表作品"
            );

        link.href = "works.html";

        stateElement.append(link);
    }

    grid.replaceChildren(
        stateElement
    );
}

function renderPage() {
    const grid =
        document.querySelector(
            "[data-favorites-grid]"
        );

    updateCounts();

    const filteredItems =
        getFilteredItems();

    if (state.items.length === 0) {
        renderState(
            "还没有收藏内容",
            "浏览作品、赏析或历史影像时，可以点击“收藏”保存到这里。",
            true
        );

        return;
    }

    if (filteredItems.length === 0) {
        renderState(
            `暂无${TYPE_LABELS[state.activeType]}`,
            "当前分类还没有收藏内容。"
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    filteredItems.forEach((item) => {
        fragment.append(
            createFavoriteCard(item)
        );
    });

    grid.replaceChildren(fragment);
}

function initializeTabs() {
    document
        .querySelectorAll(
            "[data-favorite-tab]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    state.activeType =
                        button.dataset
                            .favoriteTab;

                    renderPage();
                }
            );
        });
}

async function initializeFavoritesPage() {
    initializeTabs();

    renderState(
        "正在读取收藏",
        "请稍候……"
    );

    try {
        const result =
            await loadMyFavoriteCards();

        if (!result.user) {
            redirectToLogin();
            return;
        }

        state.items =
            result.data;

        const sourceElement =
            document.querySelector(
                "[data-favorites-source]"
            );

        if (sourceElement) {
            sourceElement.textContent =
                "数据来源：个人云端收藏";
        }

        renderPage();
    } catch (error) {
        console.error(
            "Favorites page failed:",
            error
        );

        renderState(
            "收藏读取失败",
            "请检查网络连接并刷新页面后重试。"
        );
    }
}

initializeFavoritesPage();