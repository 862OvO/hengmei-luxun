import {
    getContentDetailUrl,
    getContentTypeLabel,
    loadPublishedContents
} from "./content-service.js";

import {
    initializeFavoriteButtons
} from "./favorite-ui.js";

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

function getMetadataItems(
    contentType,
    metadata
) {
    if (contentType === "works") {
        return [
            metadata.year,
            metadata.genre,
            metadata.collection
        ];
    }

    if (contentType === "articles") {
        return [
            metadata.author,
            metadata.related_work,
            metadata.reading_time
        ];
    }

    if (contentType === "gallery") {
        return [
            metadata.category,
            metadata.display_date,
            metadata.location
        ];
    }

    return [];
}

function createMetadata(
    contentType,
    metadata
) {
    const container =
        createElement(
            "div",
            "content-card-meta"
        );

    const metadataItems =
        getMetadataItems(
            contentType,
            metadata
        ).filter(Boolean);

    metadataItems.forEach((value) => {
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

function createGalleryMedia(item) {
    const media =
        createElement(
            "div",
            "content-card-media"
        );

    const imagePath =
        item.image_path;

    const placeholderText =
        item.metadata?.category
            ? `${item.metadata.category}资料图`
            : "历史影像资料图";

    const showPlaceholder = () => {
        media.replaceChildren(
            createElement(
                "div",
                "content-card-image-placeholder",
                placeholderText
            )
        );
    };

    if (
        !imagePath ||
        imagePath.includes("placeholder")
    ) {
        showPlaceholder();
        return media;
    }

    const image =
        document.createElement("img");

    image.className =
        "content-card-image";

    image.src = imagePath;
    image.alt =
        item.metadata?.alt ||
        item.title;

    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener(
        "error",
        showPlaceholder,
        {
            once: true
        }
    );

    media.append(image);

    return media;
}

function createArticleCover(item) {
    const cover = createElement(
        "div",
        "article-card-cover"
    );
    const image = document.createElement("img");

    image.src = item.image_path ?? "";
    image.alt = item.metadata?.image_alt ?? `${item.metadata?.related_work ?? item.title}封面`;
    image.loading = "lazy";
    image.decoding = "async";
    cover.append(image);

    return cover;
}

function createArticleFocus(metadata) {
    const focus = createElement(
        "div",
        "article-card-focus"
    );

    (metadata?.key_questions ?? [])
        .slice(0, 3)
        .forEach((item) => {
            focus.append(createElement("span", "", item));
        });

    return focus;
}

function createContentCard(
    item,
    index
) {
    const card =
        createElement(
            "article",
            "content-card"
        );

    if (item.content_type === "gallery") {
        card.classList.add(
            "content-card--gallery"
        );

        card.append(
            createGalleryMedia(item)
        );
    }

    if (item.content_type === "articles") {
        card.classList.add("content-card--article");
        card.append(createArticleCover(item));
    }

    const number =
        String(index + 1).padStart(
            2,
            "0"
        );

    const title =
        createElement(
            "h3",
            "content-card-title",
            item.title
        );

    const summary =
        createElement(
            "p",
            "content-card-summary",
            item.summary
        );

    const actions =
        createElement(
            "div",
            "content-card-actions"
        );

const detailLink =
    createElement(
        "a",
        "content-detail-link",
        "查看详情"
    );

detailLink.href =
    getContentDetailUrl(item);

const favoriteButton =
    createElement(
        "button",
        "favorite-button",
        "正在检测"
    );

favoriteButton.type = "button";

favoriteButton.dataset.favoriteButton =
    "";

favoriteButton.dataset.contentId =
    item.id ?? "";

favoriteButton.dataset.contentType =
    item.content_type;

favoriteButton.dataset.slug =
    item.slug;

favoriteButton.dataset.title =
    item.title;

favoriteButton.setAttribute(
    "aria-pressed",
    "false"
);

favoriteButton.disabled = true;

actions.append(
    detailLink,
    favoriteButton
);

    card.append(
        createElement(
            "div",
            "content-card-number",
            number
        ),
        createElement(
            "div",
            "content-card-type",
            getContentTypeLabel(
                item.content_type
            )
        ),
        title,
        createMetadata(
            item.content_type,
            item.metadata
        ),
        summary,
        ...(item.content_type === "articles"
            ? [createArticleFocus(item.metadata)]
            : []),
        actions
    );

    return card;
}

function getArticleSearchText(item) {
    return [
        item.title,
        item.summary,
        item.metadata?.related_work,
        item.metadata?.analysis_focus,
        ...(item.metadata?.keywords ?? []),
        ...(item.metadata?.key_questions ?? [])
    ].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
}

async function renderRecords(container, records) {
    if (records.length === 0) {
        renderEmpty(container);
        return;
    }

    const fragment = document.createDocumentFragment();

    records.forEach((item, index) => {
        fragment.append(createContentCard(item, index));
    });

    container.replaceChildren(fragment);
    await initializeFavoriteButtons(container);
}

function initializeArticleControls(records, grid) {
    const search = document.querySelector("[data-article-search]");
    const filters = [...document.querySelectorAll("[data-article-filter]")];
    const result = document.querySelector("[data-article-result]");

    if (!search || filters.length === 0) {
        renderRecords(grid, records);
        return;
    }

    let activeFilter = "all";

    const update = async () => {
        const query = search.value.trim().toLocaleLowerCase("zh-CN");
        const filtered = records.filter((item) => {
            const matchesGenre = activeFilter === "all" || item.metadata?.genre_group === activeFilter;
            const matchesQuery = !query || getArticleSearchText(item).includes(query);
            return matchesGenre && matchesQuery;
        });

        if (result) {
            result.textContent = `当前显示 ${filtered.length} 篇，共 ${records.length} 篇`;
        }

        await renderRecords(grid, filtered);
    };

    search.addEventListener("input", update);
    filters.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.articleFilter ?? "all";
            filters.forEach((candidate) => {
                candidate.setAttribute("aria-pressed", String(candidate === button));
            });
            update();
        });
    });

    update();
}

function renderLoading(container) {
    const loading =
        createElement(
            "div",
            "content-state"
        );

    loading.append(
        createElement(
            "strong",
            "",
            "正在读取馆藏内容"
        ),
        createElement(
            "span",
            "",
            "请稍候……"
        )
    );

    container.replaceChildren(
        loading
    );
}

function renderEmpty(container) {
    const empty =
        createElement(
            "div",
            "content-state"
        );

    empty.append(
        createElement(
            "strong",
            "",
            "暂无已发布内容"
        ),
        createElement(
            "span",
            "",
            "内容可能正在整理或暂时下架。"
        )
    );

    container.replaceChildren(empty);
}

function renderError(
    container,
    error
) {
    console.error(
        "Content list failed:",
        error
    );

    const errorState =
        createElement(
            "div",
            "content-state"
        );

    errorState.append(
        createElement(
            "strong",
            "",
            "内容读取失败"
        ),
        createElement(
            "span",
            "",
            "请刷新页面后重试。"
        )
    );

    container.replaceChildren(
        errorState
    );
}

function updateSourceStatus(
    sourceElement,
    warningElement,
    result
) {
    if (!sourceElement) {
        return;
    }

    sourceElement.dataset.source =
        result.source;

    if (result.source === "supabase") {
        sourceElement.textContent =
            "数据来源：云端馆藏";

        if (warningElement) {
            warningElement.hidden = true;
            warningElement.textContent = "";
        }

        return;
    }

    sourceElement.textContent =
        "数据来源：本地备用";

    if (warningElement) {
        warningElement.hidden = false;
        warningElement.textContent =
            result.warning ??
            "当前正在使用本地备用数据。";
    }
}

async function initializeContentList() {
    const page =
        document.querySelector(
            "[data-content-list-page]"
        );

    if (!page) {
        return;
    }

    const contentType =
        page.dataset.contentType;

    const grid =
        page.querySelector(
            "[data-content-grid]"
        );

    const sourceElement =
        page.querySelector(
            "[data-content-source]"
        );

    const warningElement =
        page.querySelector(
            "[data-content-warning]"
        );

    const countElements =
        document.querySelectorAll(
            "[data-content-count]"
        );

    if (!contentType || !grid) {
        return;
    }

    renderLoading(grid);

    try {
        const result =
            await loadPublishedContents(
                contentType
            );

        updateSourceStatus(
            sourceElement,
            warningElement,
            result
        );

        countElements.forEach(
            (element) => {
                element.textContent =
                    String(
                        result.data.length
                    );
            }
        );

        if (contentType === "articles") {
            initializeArticleControls(result.data, grid);
        } else {
            await renderRecords(grid, result.data);
        }
    } catch (error) {
        countElements.forEach(
            (element) => {
                element.textContent = "0";
            }
        );

        renderError(grid, error);
    }
}

initializeContentList();
