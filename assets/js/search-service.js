import {
    getContentDetailUrl,
    getContentTypeLabel,
    loadAllPublishedContents
} from "./content-service.js";

const STATIC_PAGES = Object.freeze([
    {
        contentType: "biography",
        label: "鲁迅生平",
        url: "biography.html"
    },
    {
        contentType: "relations",
        label: "人物关系",
        url: "relations.html"
    },
    {
        contentType: "quotes",
        label: "经典语录",
        url: "quotes.html"
    },
    {
        contentType: "history",
        label: "时代背景",
        url: "history.html"
    }
]);

const STATIC_TYPE_LABELS = Object.freeze(
    Object.fromEntries(
        STATIC_PAGES.map((page) => [
            page.contentType,
            page.label
        ])
    )
);

const SEARCH_WEIGHTS = Object.freeze({
    title: 90,
    summary: 45,
    metadata: 28,
    body: 12
});

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .toLocaleLowerCase("zh-CN")
        .replace(/\s+/g, " ")
        .trim();
}

function flattenMetadata(value) {
    if (value === null || value === undefined) {
        return "";
    }

    if (Array.isArray(value)) {
        return value
            .map(flattenMetadata)
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "object") {
        return Object.values(value)
            .map(flattenMetadata)
            .filter(Boolean)
            .join(" ");
    }

    return String(value);
}

function cleanPageTitle(title) {
    return String(title ?? "")
        .replace(/｜横眉·鲁迅文化数字展馆.*$/u, "")
        .trim();
}

async function loadStaticPage(pageConfig) {
    const response = await fetch(
        pageConfig.url,
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `${pageConfig.label}读取失败：HTTP ${response.status}`
        );
    }

    const html = await response.text();
    const documentObject =
        new DOMParser().parseFromString(
            html,
            "text/html"
        );

    const title =
        documentObject.querySelector("main h1")
            ?.textContent?.trim() ||
        cleanPageTitle(
            documentObject.title
        ) ||
        pageConfig.label;

    const summary =
        documentObject.querySelector(
            'meta[name="description"]'
        )?.getAttribute("content")?.trim() ||
        "";

    const mainContent =
        documentObject.querySelector("main");

    const body =
        mainContent?.textContent
            ?.replace(/\s+/g, " ")
            .trim() ||
        summary;

    return {
        id: `static:${pageConfig.contentType}`,
        content_type: pageConfig.contentType,
        slug: pageConfig.contentType,
        title,
        summary,
        body,
        metadata: {
            page_label: pageConfig.label
        },
        updated_at: null,
        url: pageConfig.url,
        source: "static"
    };
}

function createDynamicRecord(item) {
    return {
        ...item,
        url: getContentDetailUrl(item),
        source: "dynamic"
    };
}

export function getSearchTypeLabel(
    contentType
) {
    if (STATIC_TYPE_LABELS[contentType]) {
        return STATIC_TYPE_LABELS[contentType];
    }

    try {
        return getContentTypeLabel(
            contentType
        );
    } catch {
        return "其他内容";
    }
}

export async function loadSearchRecords() {
    const [dynamicResult, staticResults] =
        await Promise.all([
            loadAllPublishedContents(),
            Promise.allSettled(
                STATIC_PAGES.map(
                    loadStaticPage
                )
            )
        ]);

    const staticRecords = [];
    const staticFailures = [];

    staticResults.forEach(
        (result, index) => {
            if (result.status === "fulfilled") {
                staticRecords.push(
                    result.value
                );
                return;
            }

            staticFailures.push({
                label:
                    STATIC_PAGES[index].label,
                message:
                    result.reason?.message ||
                    "页面读取失败"
            });
        }
    );

    return {
        data: [
            ...dynamicResult.data.map(
                createDynamicRecord
            ),
            ...staticRecords
        ],
        usedFallback:
            dynamicResult.usedFallback,
        sources:
            dynamicResult.sources,
        staticFailures
    };
}

function countOccurrences(
    source,
    keyword
) {
    if (!source || !keyword) {
        return 0;
    }

    let count = 0;
    let startIndex = 0;

    while (startIndex < source.length) {
        const matchIndex =
            source.indexOf(
                keyword,
                startIndex
            );

        if (matchIndex === -1) {
            break;
        }

        count += 1;
        startIndex =
            matchIndex +
            Math.max(keyword.length, 1);
    }

    return count;
}

function calculateFieldScore(
    fieldText,
    tokens,
    weight
) {
    return tokens.reduce(
        (score, token) => {
            const count =
                countOccurrences(
                    fieldText,
                    token
                );

            return (
                score +
                Math.min(count, 5) *
                    weight
            );
        },
        0
    );
}

function createSnippet(
    record,
    normalizedFields,
    tokens
) {
    const candidates = [
        [record.summary, normalizedFields.summary],
        [record.body, normalizedFields.body],
        [
            flattenMetadata(record.metadata),
            normalizedFields.metadata
        ]
    ];

    let sourceText =
        record.summary ||
        record.body ||
        flattenMetadata(record.metadata) ||
        "";

    let normalizedSource =
        normalizeText(sourceText);

    for (const candidate of candidates) {
        if (
            tokens.some((token) =>
                candidate[1].includes(token)
            )
        ) {
            sourceText = candidate[0];
            normalizedSource = candidate[1];
            break;
        }
    }

    if (!sourceText) {
        return "";
    }

    const firstMatch = tokens
        .map((token) =>
            normalizedSource.indexOf(token)
        )
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];

    const safeIndex =
        Number.isInteger(firstMatch)
            ? firstMatch
            : 0;

    const start =
        Math.max(0, safeIndex - 45);

    const end =
        Math.min(
            sourceText.length,
            start + 150
        );

    return (
        (start > 0 ? "…" : "") +
        sourceText.slice(start, end).trim() +
        (end < sourceText.length ? "…" : "")
    );
}

export function searchRecords(
    records,
    rawQuery
) {
    const normalizedQuery =
        normalizeText(rawQuery);

    if (!normalizedQuery) {
        return [];
    }

    const tokens = [
        ...new Set(
            normalizedQuery
                .split(/\s+/)
                .filter(Boolean)
        )
    ];

    return records
        .map((record) => {
            const normalizedFields = {
                title:
                    normalizeText(record.title),
                summary:
                    normalizeText(record.summary),
                metadata:
                    normalizeText(
                        flattenMetadata(
                            record.metadata
                        )
                    ),
                body:
                    normalizeText(record.body)
            };

            const searchableText =
                Object.values(
                    normalizedFields
                ).join(" ");

            const matchesAllTokens =
                tokens.every((token) =>
                    searchableText.includes(token)
                );

            if (!matchesAllTokens) {
                return null;
            }

            let score = 0;

            score += calculateFieldScore(
                normalizedFields.title,
                tokens,
                SEARCH_WEIGHTS.title
            );

            score += calculateFieldScore(
                normalizedFields.summary,
                tokens,
                SEARCH_WEIGHTS.summary
            );

            score += calculateFieldScore(
                normalizedFields.metadata,
                tokens,
                SEARCH_WEIGHTS.metadata
            );

            score += calculateFieldScore(
                normalizedFields.body,
                tokens,
                SEARCH_WEIGHTS.body
            );

            if (
                normalizedFields.title ===
                normalizedQuery
            ) {
                score += 240;
            } else if (
                normalizedFields.title.includes(
                    normalizedQuery
                )
            ) {
                score += 120;
            }

            if (
                normalizedFields.summary.includes(
                    normalizedQuery
                )
            ) {
                score += 50;
            }

            return {
                ...record,
                score,
                snippet:
                    createSnippet(
                        record,
                        normalizedFields,
                        tokens
                    )
            };
        })
        .filter(Boolean)
        .sort((first, second) => {
            if (second.score !== first.score) {
                return second.score - first.score;
            }

            const firstTime =
                Date.parse(
                    first.updated_at || ""
                ) || 0;

            const secondTime =
                Date.parse(
                    second.updated_at || ""
                ) || 0;

            if (secondTime !== firstTime) {
                return secondTime - firstTime;
            }

            return first.title.localeCompare(
                second.title,
                "zh-CN"
            );
        });
}
