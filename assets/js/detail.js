import {
    CONTENT_TYPES,
    getContentTypeLabel,
    loadContentBySlug
} from "./content-service.js";

import {
    initializeFavoriteButtons
} from "./favorite-ui.js";

import {
    collectReferenceNumbers,
    parseDetailBody
} from "./detail-body-parser.js";

const PAGE_CONFIG = Object.freeze({
    works: {
        backUrl: "works.html",
        backLabel: "返回代表作品",
        bodyHeading: "作品简介"
    },

    articles: {
        backUrl: "articles.html",
        backLabel: "返回作品赏析",
        bodyHeading: "赏析正文"
    },

    gallery: {
        backUrl: "gallery.html",
        backLabel: "返回历史影像",
        bodyHeading: "影像说明"
    }
});

const METADATA_CONFIG = Object.freeze({
    works: [
        ["year", "创作或发表时间"],
        ["genre", "作品体裁"],
        ["collection", "收录作品集"],
        ["first_published", "首次发表"],
        ["creation_place", "创作地点"],
        ["original_title", "原名"],
        ["article_count", "篇目数量"],
        ["keywords", "主题关键词"]
    ],

    articles: [
        ["author", "文章作者"],
        ["related_work", "相关作品"],
        ["analysis_focus", "赏析角度"],
        ["reading_time", "阅读时间"],
        ["keywords", "主题关键词"]
    ],

    gallery: [
        ["display_date", "影像时间"],
        ["location", "相关地点"],
        ["category", "影像分类"],
        ["source_name", "资料来源"],
        ["license", "授权信息"],
        ["keywords", "主题关键词"]
    ]
});

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

function getPageParameters() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    return {
        contentType:
            parameters.get("type") ?? "",

        slug:
            parameters.get("id") ?? ""
    };
}

function formatMetadataValue(value) {
    if (Array.isArray(value)) {
        return value
            .map(String)
            .filter(Boolean)
            .join("、");
    }

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    return String(value);
}

function renderMetadata(
    contentType,
    metadata,
    list
) {
    const definitions =
        METADATA_CONFIG[contentType] ?? [];

    const fragment =
        document.createDocumentFragment();

    definitions.forEach(
        ([fieldName, label]) => {
            const value =
                formatMetadataValue(
                    metadata[fieldName]
                );

            if (!value) {
                return;
            }

            const row =
                createElement(
                    "div",
                    "detail-meta-row"
                );

            const term =
                createElement(
                    "dt",
                    "",
                    label
                );

            const description =
                createElement(
                    "dd",
                    "",
                    value
                );

            row.append(
                term,
                description
            );

            fragment.append(row);
        }
    );

    if (!fragment.childNodes.length) {
        const row =
            createElement(
                "div",
                "detail-meta-row"
            );

        row.append(
            createElement(
                "dt",
                "",
                "资料状态"
            ),
            createElement(
                "dd",
                "",
                "相关资料正在整理中"
            )
        );

        fragment.append(row);
    }

    list.replaceChildren(fragment);
}

const INLINE_TOKEN_PATTERN =
    /https:\/\/[^\s<>()]+|\[(\d+)\]/g;

function appendInlineContent(
    container,
    text,
    referenceNumbers,
    citationState
) {
    const value =
        String(text ?? "");

    let cursor = 0;

    for (
        const match of
        value.matchAll(
            INLINE_TOKEN_PATTERN
        )
    ) {
        const token = match[0];
        const start = match.index ?? 0;

        if (start > cursor) {
            container.append(
                document.createTextNode(
                    value.slice(
                        cursor,
                        start
                    )
                )
            );
        }

        if (token.startsWith("https://")) {
            const link =
                createElement(
                    "a",
                    "detail-external-link",
                    token
                );

            link.href = token;
            link.target = "_blank";
            link.rel =
                "noopener noreferrer";

            container.append(link);
        } else {
            const number =
                match[1];

            if (
                referenceNumbers.has(
                    number
                )
            ) {
                const nextCount =
                    (
                        citationState.counts
                            .get(number) ??
                        0
                    ) + 1;

                citationState.counts.set(
                    number,
                    nextCount
                );

                const citationId =
                    `citation-${number}-${nextCount}`;

                if (
                    !citationState
                        .firstIds
                        .has(number)
                ) {
                    citationState
                        .firstIds
                        .set(
                            number,
                            citationId
                        );
                }

                const superscript =
                    createElement(
                        "sup",
                        "detail-citation"
                    );

                const link =
                    createElement(
                        "a",
                        "",
                        `[${number}]`
                    );

                link.id = citationId;
                link.href =
                    `#reference-${number}`;

                superscript.append(link);
                container.append(
                    superscript
                );
            } else {
                container.append(
                    document.createTextNode(
                        token
                    )
                );

                console.warn(
                    `Missing reference: ${token}`
                );
            }
        }

        cursor =
            start + token.length;
    }

    if (cursor < value.length) {
        container.append(
            document.createTextNode(
                value.slice(cursor)
            )
        );
    }
}

function createQuoteElement(
    block,
    referenceNumbers,
    citationState
) {
    const quote =
        createElement(
            "blockquote",
            "detail-quote"
        );

    const lines = [
        ...block.lines
    ];

    const lastLine =
        lines.at(-1) ?? "";

    const hasAttribution =
        lastLine.startsWith("——");

    const contentLines =
        hasAttribution
            ? lines.slice(0, -1)
            : lines;

    const paragraph =
        createElement(
            "p",
            "detail-quote-text"
        );

    contentLines.forEach(
        (line, index) => {
            if (index > 0) {
                paragraph.append(
                    document.createElement(
                        "br"
                    )
                );
            }

            appendInlineContent(
                paragraph,
                line,
                referenceNumbers,
                citationState
            );
        }
    );

    quote.append(paragraph);

    if (hasAttribution) {
        quote.append(
            createElement(
                "cite",
                "detail-quote-source",
                lastLine
            )
        );
    }

    return quote;
}

function createMainBlockElement(
    block,
    referenceNumbers,
    citationState
) {
    if (block.type === "heading") {
        return createElement(
            "h2",
            "detail-section-heading",
            block.text
        );
    }

    if (block.type === "quote") {
        return createQuoteElement(
            block,
            referenceNumbers,
            citationState
        );
    }

    if (block.type === "list") {
        const list =
            createElement(
                "ul",
                "detail-key-points"
            );

        block.items.forEach(
            (item) => {
                const listItem =
                    document.createElement(
                        "li"
                    );

                appendInlineContent(
                    listItem,
                    item,
                    referenceNumbers,
                    citationState
                );

                list.append(
                    listItem
                );
            }
        );

        return list;
    }

    const paragraph =
        document.createElement("p");

    appendInlineContent(
        paragraph,
        block.text,
        referenceNumbers,
        citationState
    );

    return paragraph;
}

function createReferenceSection(
    blocks,
    citationState
) {
    const section =
        createElement(
            "section",
            "detail-references"
        );

    section.setAttribute(
        "aria-labelledby",
        "detail-references-title"
    );

    const heading =
        createElement(
            "h2",
            "detail-section-heading",
            "参考资料"
        );

    heading.id =
        "detail-references-title";

    const list =
        createElement(
            "ol",
            "detail-reference-list"
        );

    blocks.forEach(
        (block) => {
            if (
                block.type !==
                "reference"
            ) {
                if (
                    block.type ===
                    "paragraph"
                ) {
                    const note =
                        createElement(
                            "p",
                            "detail-reference-note"
                        );

                    appendInlineContent(
                        note,
                        block.text,
                        new Set(),
                        citationState
                    );

                    section.append(note);
                }

                return;
            }

            const item =
                createElement(
                    "li",
                    "detail-reference-item"
                );

            item.id =
                `reference-${block.number}`;

            const marker =
                createElement(
                    "span",
                    "detail-reference-marker",
                    `[${block.number}]`
                );

            item.append(marker);

            appendInlineContent(
                item,
                block.text,
                new Set(),
                citationState
            );

            const firstCitationId =
                citationState
                    .firstIds
                    .get(
                        String(
                            block.number
                        )
                    );

            if (firstCitationId) {
                const backLink =
                    createElement(
                        "a",
                        "detail-reference-back",
                        "返回正文"
                    );

                backLink.href =
                    `#${firstCitationId}`;

                item.append(backLink);
            }

            list.append(item);
        }
    );

    section.prepend(
        heading,
        list
    );

    return section;
}

function renderBody(
    body,
    container
) {
    const blocks =
        parseDetailBody(body);

    if (blocks.length === 0) {
        container.classList.remove(
            "detail-body--structured"
        );

        container.replaceChildren(
            createElement(
                "p",
                "",
                "相关内容正在整理中。"
            )
        );

        return;
    }

    const hasStructuredBlocks =
        blocks.some(
            (block) =>
                block.type !==
                "paragraph"
        );

    container.classList.toggle(
        "detail-body--structured",
        hasStructuredBlocks
    );

    const referenceNumbers =
        collectReferenceNumbers(
            blocks
        );

    const citationState = {
        counts: new Map(),
        firstIds: new Map()
    };

    const referenceHeadingIndex =
        blocks.findIndex(
            (block) =>
                block.type ===
                    "heading" &&
                block.isReferenceHeading
        );

    const mainBlocks =
        referenceHeadingIndex >= 0
            ? blocks.slice(
                0,
                referenceHeadingIndex
            )
            : blocks;

    const referenceBlocks =
        referenceHeadingIndex >= 0
            ? blocks.slice(
                referenceHeadingIndex + 1
            )
            : [];

    const fragment =
        document
            .createDocumentFragment();

    mainBlocks.forEach(
        (block) => {
            fragment.append(
                createMainBlockElement(
                    block,
                    referenceNumbers,
                    citationState
                )
            );
        }
    );

    if (referenceHeadingIndex >= 0) {
        fragment.append(
            createReferenceSection(
                referenceBlocks,
                citationState
            )
        );
    }

    container.replaceChildren(
        fragment
    );
}


function applyContentTypeClass(
    article,
    contentType
) {
    CONTENT_TYPES.forEach(
        (type) => {
            article.classList.remove(
                `detail-article--${type}`
            );
        }
    );

    article.classList.add(
        `detail-article--${contentType}`
    );
}

function renderImageCredit(
    item,
    container
) {
    const metadata =
        item.metadata ?? {};

    const rows = [
        [
            "图片说明",
            metadata.image_caption
        ],
        [
            "作者或设计",
            metadata.image_creator
        ],
        [
            "年代",
            metadata.image_date
        ],
        [
            "来源",
            metadata.image_source
        ],
        [
            "授权",
            metadata.image_license
        ]
    ].filter(
        ([, value]) =>
            Boolean(
                formatMetadataValue(
                    value
                )
            )
    );

    if (rows.length === 0) {
        container.hidden = true;
        container.replaceChildren();
        return;
    }

    const title =
        createElement(
            "strong",
            "detail-image-credit-title",
            metadata.image_type ===
                "historical"
                ? "历史书影说明"
                : "原创封面说明"
        );

    const list =
        createElement(
            "dl",
            "detail-image-credit-list"
        );

    rows.forEach(
        ([label, rawValue]) => {
            const row =
                createElement(
                    "div",
                    "detail-image-credit-row"
                );

            row.append(
                createElement(
                    "dt",
                    "",
                    label
                ),
                createElement(
                    "dd",
                    "",
                    formatMetadataValue(
                        rawValue
                    )
                )
            );

            list.append(row);
        }
    );

    container.replaceChildren(
        title,
        list
    );

    container.hidden = false;
}

function renderImage(
    item,
    wrapper,
    image,
    placeholder
) {
    const isWork =
        item.content_type === "works";

    const showPlaceholder = (
        message
    ) => {
        wrapper.hidden = false;
        image.hidden = true;
        placeholder.hidden = false;

        placeholder.classList.toggle(
            "detail-image-placeholder--cover",
            isWork
        );

        placeholder.textContent =
            message;
    };

    const imagePath =
        item.image_path;

    if (!imagePath) {
        if (isWork) {
            showPlaceholder(
                `《${item.title}》\n作品封面整理中`
            );
        } else {
            wrapper.hidden = true;
        }

        return;
    }

    wrapper.hidden = false;

    const isPlaceholder =
        imagePath.includes(
            "placeholder"
        );

    if (isPlaceholder) {
        showPlaceholder(
            isWork
                ? `《${item.title}》\n作品封面`
                : (
                    item.metadata?.category
                        ? `${item.metadata.category}资料图`
                        : "历史影像资料图"
                )
        );

        return;
    }

    placeholder.hidden = true;
    image.hidden = false;

    image.classList.toggle(
        "detail-image--cover",
        isWork
    );

    image.src = imagePath;

    image.alt =
        item.metadata?.image_alt ||
        item.metadata?.alt ||
        item.title;

    image.addEventListener(
        "error",
        () => {
            showPlaceholder(
                isWork
                    ? `《${item.title}》\n封面暂不可用`
                    : "图片资料暂不可用"
            );
        },
        {
            once: true
        }
    );
}

function updateActiveNavigation(
    contentType
) {
    const pageConfig =
        PAGE_CONFIG[contentType];

    if (!pageConfig) {
        return;
    }

    document
        .querySelectorAll(
            ".site-nav .nav-link"
        )
        .forEach((link) => {
            const isActive =
                link.getAttribute("href") ===
                pageConfig.backUrl;

            link.classList.toggle(
                "active",
                isActive
            );

            if (isActive) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        });
}

function updateSourceStatus(
    sourceElement,
    warningElement,
    result
) {
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

    warningElement.hidden = false;
    warningElement.textContent =
        result.warning ??
        "当前正在使用本地备用数据。";
}

function showState(
    stateElement,
    title,
    message
) {
    stateElement.hidden = false;

    stateElement.replaceChildren(
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
}

function renderContent(
    item,
    result,
    elements
) {
    const pageConfig =
        PAGE_CONFIG[item.content_type];

    applyContentTypeClass(
        elements.article,
        item.content_type
    );

    document.title =
        `${item.title}｜横眉·鲁迅文化数字展馆`;

    elements.backLink.href =
        pageConfig.backUrl;

    elements.backLink.textContent =
        pageConfig.backLabel;

    elements.type.textContent =
        getContentTypeLabel(
            item.content_type
        );

    elements.title.textContent =
        item.title;

    elements.summary.textContent =
        item.summary;

if (elements.favoriteButton) {
    elements.favoriteButton.dataset
        .contentId =
        item.id ?? "";

    elements.favoriteButton.dataset
        .contentType =
        item.content_type;

    elements.favoriteButton.dataset
        .slug =
        item.slug;

    elements.favoriteButton.dataset
        .title =
        item.title;
}

    elements.bodyHeading.textContent =
        pageConfig.bodyHeading;

    renderMetadata(
        item.content_type,
        item.metadata,
        elements.metadataList
    );

    renderBody(
        item.body,
        elements.body
    );

    renderImage(
        item,
        elements.imageWrapper,
        elements.image,
        elements.imagePlaceholder
    );

    renderImageCredit(
        item,
        elements.imageCredit
    );

    updateSourceStatus(
        elements.source,
        elements.warning,
        result
    );

elements.state.hidden = true;
elements.article.hidden = false;

initializeFavoriteButtons(
    elements.article
);
}

async function initializeDetailPage() {
    const elements = {
		favoriteButton:
    		document.querySelector(
        			"[data-favorite-button]"
    		),

        state:
            document.querySelector(
                "[data-detail-state]"
            ),

        article:
            document.querySelector(
                "[data-detail-article]"
            ),

        backLink:
            document.querySelector(
                "[data-detail-back]"
            ),

        source:
            document.querySelector(
                "[data-detail-source]"
            ),

        warning:
            document.querySelector(
                "[data-detail-warning]"
            ),

        type:
            document.querySelector(
                "[data-detail-type]"
            ),

        title:
            document.querySelector(
                "[data-detail-title]"
            ),

        summary:
            document.querySelector(
                "[data-detail-summary]"
            ),

        metadataList:
            document.querySelector(
                "[data-detail-metadata]"
            ),

        bodyHeading:
            document.querySelector(
                "[data-detail-body-heading]"
            ),

        body:
            document.querySelector(
                "[data-detail-body]"
            ),

        imageWrapper:
            document.querySelector(
                "[data-detail-image-wrapper]"
            ),

        image:
            document.querySelector(
                "[data-detail-image]"
            ),

        imagePlaceholder:
            document.querySelector(
                "[data-detail-image-placeholder]"
            ),

        imageCredit:
            document.querySelector(
                "[data-detail-image-credit]"
            )
    };

    if (
        !elements.state ||
        !elements.article
    ) {
        return;
    }

    const {
        contentType,
        slug
    } = getPageParameters();

    if (
        !CONTENT_TYPES.includes(
            contentType
        ) ||
        !slug
    ) {
        showState(
            elements.state,
            "详情链接无效",
            "缺少正确的内容类型或内容编号。"
        );

        return;
    }

    const pageConfig =
        PAGE_CONFIG[contentType];

updateActiveNavigation(
    contentType
);

    elements.backLink.href =
        pageConfig.backUrl;

    elements.backLink.textContent =
        pageConfig.backLabel;

    try {
        const result =
            await loadContentBySlug(
                contentType,
                slug
            );

        if (!result.data) {
            showState(
                elements.state,
                "未找到相关内容",
                "该内容可能尚未发布、已经下架或链接有误。"
            );

            elements.source.textContent =
                "内容状态：不可用";

            return;
        }

        renderContent(
            result.data,
            result,
            elements
        );
    } catch (error) {
        console.error(
            "Detail page failed:",
            error
        );

        showState(
            elements.state,
            "内容读取失败",
            "请检查网络连接并刷新页面后重试。"
        );

        elements.source.textContent =
            "数据来源：读取失败";
    }
}

initializeDetailPage();