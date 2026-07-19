import {
    getSearchTypeLabel,
    loadSearchRecords,
    searchRecords
} from "./search-service.js";

const TYPE_ORDER = Object.freeze([
    "works",
    "articles",
    "gallery",
    "biography",
    "relations",
    "quotes",
    "history"
]);

let searchData = null;

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

function escapeRegExp(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

function getHighlightTerms(query) {
    const trimmed =
        String(query ?? "").trim();

    if (!trimmed) {
        return [];
    }

    return [
        ...new Set([
            trimmed,
            ...trimmed
                .split(/\s+/)
                .filter(Boolean)
        ])
    ].sort(
        (first, second) =>
            second.length - first.length
    );
}

function appendHighlightedText(
    container,
    text,
    query
) {
    const sourceText =
        String(text ?? "");

    const terms =
        getHighlightTerms(query);

    if (!sourceText || terms.length === 0) {
        container.textContent = sourceText;
        return;
    }

    const expression =
        new RegExp(
            `(${terms
                .map(escapeRegExp)
                .join("|")})`,
            "gi"
        );

    sourceText
        .split(expression)
        .filter((part) => part !== "")
        .forEach((part) => {
            const isMatch =
                terms.some(
                    (term) =>
                        part.localeCompare(
                            term,
                            undefined,
                            {
                                sensitivity:
                                    "accent"
                            }
                        ) === 0
                );

            if (isMatch) {
                const mark =
                    document.createElement(
                        "mark"
                    );

                mark.textContent = part;
                container.append(mark);
                return;
            }

            container.append(
                document.createTextNode(
                    part
                )
            );
        });
}

function getQueryFromUrl() {
    return (
        new URLSearchParams(
            window.location.search
        ).get("q") || ""
    ).trim();
}

function updateUrl(query) {
    const url =
        new URL(window.location.href);

    if (query) {
        url.searchParams.set("q", query);
    } else {
        url.searchParams.delete("q");
    }

    window.history.pushState(
        {},
        "",
        url
    );
}

function renderState(
    title,
    message
) {
    const resultsContainer =
        document.querySelector(
            "[data-search-results]"
        );

    const state =
        createElement(
            "div",
            "search-state"
        );

    state.append(
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

    resultsContainer.replaceChildren(
        state
    );
}

function createResultCard(
    item,
    query
) {
    const article =
        createElement(
            "article",
            "search-result-card"
        );

    const type =
        createElement(
            "div",
            "search-result-type",
            getSearchTypeLabel(
                item.content_type
            )
        );

    const titleLink =
        createElement(
            "a",
            "search-result-title"
        );

    titleLink.href = item.url;

    appendHighlightedText(
        titleLink,
        item.title,
        query
    );

    const snippet =
        createElement(
            "p",
            "search-result-snippet"
        );

    appendHighlightedText(
        snippet,
        item.snippet || item.summary,
        query
    );

    const footer =
        createElement(
            "div",
            "search-result-footer"
        );

    const score =
        createElement(
            "span",
            "search-result-score",
            `相关度 ${item.score}`
        );

    const enterLink =
        createElement(
            "a",
            "search-result-link",
            "查看内容"
        );

    enterLink.href = item.url;

    footer.append(score, enterLink);

    article.append(
        type,
        titleLink,
        snippet,
        footer
    );

    return article;
}

function groupResults(results) {
    const groups =
        new Map();

    results.forEach((item) => {
        if (!groups.has(item.content_type)) {
            groups.set(
                item.content_type,
                []
            );
        }

        groups.get(
            item.content_type
        ).push(item);
    });

    return groups;
}

function renderResults(
    results,
    query
) {
    const resultsContainer =
        document.querySelector(
            "[data-search-results]"
        );

    const countElements =
        document.querySelectorAll(
            "[data-search-count]"
        );

    countElements.forEach((element) => {
        element.textContent =
            String(results.length);
    });

    const keywordElement =
        document.querySelector(
            "[data-search-keyword]"
        );

    keywordElement.textContent = query;

    document.title =
        `${query}的搜索结果｜横眉·鲁迅文化数字展馆`;

    if (results.length === 0) {
        renderState(
            "没有找到相关内容",
            "请尝试更短的关键词，或搜索作品名、人物名和主题词。"
        );
        return;
    }

    const groups =
        groupResults(results);

    const fragment =
        document.createDocumentFragment();

    TYPE_ORDER.forEach((contentType) => {
        const items =
            groups.get(contentType);

        if (!items?.length) {
            return;
        }

        const section =
            createElement(
                "section",
                "search-result-group"
            );

        const heading =
            createElement(
                "div",
                "search-result-group-heading"
            );

        heading.append(
            createElement(
                "h2",
                "",
                getSearchTypeLabel(
                    contentType
                )
            ),
            createElement(
                "span",
                "",
                `${items.length} 条`
            )
        );

        const grid =
            createElement(
                "div",
                "search-result-grid"
            );

        items.forEach((item) => {
            grid.append(
                createResultCard(
                    item,
                    query
                )
            );
        });

        section.append(
            heading,
            grid
        );

        fragment.append(section);
    });

    resultsContainer.replaceChildren(
        fragment
    );
}

function updateDataNotice(result) {
    const notice =
        document.querySelector(
            "[data-search-notice]"
        );

    const messages = [];

    if (result.usedFallback) {
        messages.push(
            "部分动态内容正在使用本地备用数据"
        );
    }

    if (result.staticFailures.length > 0) {
        messages.push(
            `有 ${result.staticFailures.length} 个静态栏目暂未读取`
        );
    }

    if (messages.length === 0) {
        notice.hidden = true;
        notice.textContent = "";
        return;
    }

    notice.hidden = false;
    notice.textContent =
        messages.join("；") + "。";
}

async function performSearch(
    query
) {
    const normalizedQuery =
        String(query ?? "").trim();

    const input =
        document.querySelector(
            "[data-search-input]"
        );

    input.value = normalizedQuery;

    if (!normalizedQuery) {
        document
            .querySelectorAll(
                "[data-search-count]"
            )
            .forEach((element) => {
                element.textContent = "0";
            });

        document.querySelector(
            "[data-search-keyword]"
        ).textContent = "尚未输入";

        renderState(
            "输入关键词开始检索",
            "可搜索作品名、人物、时代背景、主题词和赏析内容。"
        );
        return;
    }

    renderState(
        "正在检索全站内容",
        "请稍候……"
    );

    try {
        if (!searchData) {
            searchData =
                await loadSearchRecords();

            updateDataNotice(
                searchData
            );
        }

        const results =
            searchRecords(
                searchData.data,
                normalizedQuery
            );

        renderResults(
            results,
            normalizedQuery
        );
    } catch (error) {
        console.error(
            "Search page failed:",
            error
        );

        renderState(
            "搜索服务暂时不可用",
            "请检查网络连接并刷新页面后重试。"
        );
    }
}

function initializeSearchForm() {
    const form =
        document.querySelector(
            "[data-search-form]"
        );

    const input =
        document.querySelector(
            "[data-search-input]"
        );

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const query =
                input.value.trim();

            updateUrl(query);
            performSearch(query);
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            performSearch(
                getQueryFromUrl()
            );
        }
    );
}

initializeSearchForm();
performSearch(getQueryFromUrl());
