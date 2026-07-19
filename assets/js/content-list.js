import {
    getContentDetailUrl,
    getContentTypeLabel,
    loadPublishedContents
} from "./content-service.js";

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

function createContentCard(
    item,
    index
) {
    const card =
        createElement(
            "article",
            "content-card"
        );

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

    actions.append(detailLink);

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
        actions
    );

    return card;
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

        warningElement.hidden = true;
        warningElement.textContent = "";
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

        if (result.data.length === 0) {
            renderEmpty(grid);
            return;
        }

        const fragment =
            document.createDocumentFragment();

        result.data.forEach(
            (item, index) => {
                fragment.append(
                    createContentCard(
                        item,
                        index
                    )
                );
            }
        );

        grid.replaceChildren(fragment);
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