import {
    CONTENT_TYPES,
    getContentTypeLabel,
    loadContentBySlug
} from "./content-service.js";

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

function renderBody(body, container) {
    const paragraphs =
        String(body ?? "")
            .split(/\n{2,}/)
            .map(
                (paragraph) =>
                    paragraph.trim()
            )
            .filter(Boolean);

    if (paragraphs.length === 0) {
        container.replaceChildren(
            createElement(
                "p",
                "",
                "相关内容正在整理中。"
            )
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    paragraphs.forEach(
        (paragraph) => {
            fragment.append(
                createElement(
                    "p",
                    "",
                    paragraph
                )
            );
        }
    );

    container.replaceChildren(fragment);
}

function renderImage(
    item,
    wrapper,
    image,
    placeholder
) {
    const imagePath =
        item.image_path;

    if (!imagePath) {
        wrapper.hidden = true;
        return;
    }

    wrapper.hidden = false;

    const isPlaceholder =
        imagePath.includes(
            "placeholder"
        );

    if (isPlaceholder) {
        image.hidden = true;
        placeholder.hidden = false;

        placeholder.textContent =
            item.metadata?.category
                ? `${item.metadata.category}资料图`
                : "历史影像资料图";

        return;
    }

    placeholder.hidden = true;
    image.hidden = false;

    image.src = imagePath;
    image.alt =
        item.metadata?.alt ||
        item.title;

    image.addEventListener(
        "error",
        () => {
            image.hidden = true;
            placeholder.hidden = false;
            placeholder.textContent =
                "图片资料暂不可用";
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

    updateSourceStatus(
        elements.source,
        elements.warning,
        result
    );

    elements.state.hidden = true;
    elements.article.hidden = false;
}

async function initializeDetailPage() {
    const elements = {
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