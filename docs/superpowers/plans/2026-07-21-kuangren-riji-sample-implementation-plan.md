# 《狂人日记》代表作品详情样板实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变 Supabase 表结构、详情 URL、搜索和收藏机制的前提下，完成《狂人日记》1400～1800 字代表作品详情样板，并建立可复用于其余五部作品的安全轻量标记正文、作品封面档案布局和单条内容迁移流程。

**Architecture:** 新增一个无 DOM 依赖的 `detail-body-parser.js`，把有限轻量标记解析成结构化块；`detail.js` 继续负责 DOM 渲染，并严格使用 `textContent`、`createTextNode` 和元素属性。作品数据先更新 `works.json`，再由单条迁移生成器创建只更新 `works/kuangren-riji` 的迁移；初始种子文件同步更新，但不得在现有数据库重新执行全量种子。

**Tech Stack:** HTML5、CSS3、原生 JavaScript ES Modules、Node.js 内置 `node:test`、JSON、Supabase PostgreSQL、Git。

## Global Constraints

- 保留现有六部作品：《狂人日记》《阿Q正传》《故乡》《祝福》《朝花夕拾》《野草》。
- 本轮只扩写 `content_type = 'works'` 且 `slug = 'kuangren-riji'` 的记录。
- 正文使用一个 `body` 字段，不修改 `public.contents` 表结构。
- 详情地址保持 `detail.html?type=works&id=kuangren-riji`。
- 轻量标记只支持 `##`、`>`、`-`、普通段落、`[数字]` 和 `https://` URL。
- 正文不得通过 `innerHTML` 渲染。
- 《狂人日记》正文中文字符数保持 1400～1800。
- 原文短引共 2 处，每处保持短句规模并标明《狂人日记》。
- 每部作品独立使用 4～6 条参考资料；本样板使用 5 条。
- 封面采用本站原创 SVG，明确标注来源和使用说明。
- Supabase 更新迁移必须恰好更新一行，否则主动抛错并回滚。
- 不执行会覆盖其他正式内容的全量数据库更新。
- 桌面端和 375×812 手机端不得出现横向滚动条。
- 作品赏析和历史影像详情布局不得套用作品封面样式。
- 每个任务完成后运行该任务的自动测试并独立提交。

---

## 文件结构锁定

### 新增文件

```text
assets/js/detail-body-parser.js
assets/images/works/kuangren-riji-cover.svg
tests/detail-body-parser.test.mjs
tests/kuangren-sample.test.cjs
tests/generate-single-content-migration.test.cjs
scripts/generate-single-content-migration.cjs
docs/鲁迅代表作品图片来源与授权登记.md
supabase/migrations/011_update_kuangren_riji_sample.sql
```

### 修改文件

```text
detail.html
assets/js/detail.js
assets/css/detail.css
assets/data/works.json
supabase/migrations/003_seed_initial_contents.sql
```

### 各文件职责

- `detail-body-parser.js`：只负责把正文字符串解析为块数据，不访问 DOM。
- `detail.js`：只负责页面参数、数据读取、DOM 渲染、图片状态和收藏初始化。
- `detail.css`：负责结构化正文、作品档案首屏和响应式样式。
- `works.json`：本地备用数据和内容事实来源。
- `kuangren-riji-cover.svg`：本站原创视觉封面。
- `generate-single-content-migration.cjs`：从 JSON 生成单条安全更新迁移。
- `011_update_kuangren_riji_sample.sql`：更新现有 Supabase 项目中的唯一目标记录。
- `003_seed_initial_contents.sql`：供全新部署使用的完整初始内容，不能在现有项目重新执行。
- 三个测试文件：分别验证解析器、样板内容和迁移生成器。

---

### Task 1: 建立可测试的轻量标记解析器

**Files:**
- Create: `tests/detail-body-parser.test.mjs`
- Create: `assets/js/detail-body-parser.js`

**Interfaces:**
- Consumes: 一个任意正文字符串。
- Produces: `parseDetailBody(source: unknown): Array<DetailBlock>`。
- Produces: `collectReferenceNumbers(blocks: DetailBlock[]): Set<string>`。
- `DetailBlock` 只包含 `heading`、`paragraph`、`quote`、`list`、`reference` 五种类型。

- [ ] **Step 1: 先写解析器测试**

创建 `tests/detail-body-parser.test.mjs`：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile =
    fileURLToPath(
        import.meta.url
    );

const projectRoot =
    path.resolve(
        path.dirname(currentFile),
        ".."
    );

const parserPath =
    path.join(
        projectRoot,
        "assets",
        "js",
        "detail-body-parser.js"
    );

const parserSource =
    await fs.readFile(
        parserPath,
        "utf8"
    );

const parserModule =
    await import(
        `data:text/javascript;base64,${Buffer
            .from(parserSource)
            .toString("base64")}`
    );

const {
    parseDetailBody,
    collectReferenceNumbers
} = parserModule;

test(
    "解析标题、段落、引文、列表和参考资料",
    () => {
        const source = [
            "## 作品导读",
            "",
            "正文内容[1]。",
            "",
            "> 短引。",
            "> ——《狂人日记》",
            "",
            "- 要点一",
            "- 要点二",
            "",
            "## 参考资料",
            "",
            "[1] 资料名称 https://example.com/source"
        ].join("\n");

        const blocks =
            parseDetailBody(source);

        assert.deepEqual(
            blocks,
            [
                {
                    type: "heading",
                    text: "作品导读",
                    isReferenceHeading: false
                },
                {
                    type: "paragraph",
                    text: "正文内容[1]。"
                },
                {
                    type: "quote",
                    lines: [
                        "短引。",
                        "——《狂人日记》"
                    ]
                },
                {
                    type: "list",
                    items: [
                        "要点一",
                        "要点二"
                    ]
                },
                {
                    type: "heading",
                    text: "参考资料",
                    isReferenceHeading: true
                },
                {
                    type: "reference",
                    number: "1",
                    text:
                        "资料名称 https://example.com/source"
                }
            ]
        );

        assert.deepEqual(
            [
                ...collectReferenceNumbers(
                    blocks
                )
            ],
            ["1"]
        );
    }
);

test(
    "兼容旧正文的普通段落",
    () => {
        assert.deepEqual(
            parseDetailBody(
                "第一段。\r\n\r\n第二段。"
            ),
            [
                {
                    type: "paragraph",
                    text: "第一段。"
                },
                {
                    type: "paragraph",
                    text: "第二段。"
                }
            ]
        );
    }
);

test(
    "未支持标记按普通文字保留",
    () => {
        assert.deepEqual(
            parseDetailBody(
                "### 未支持标题\n普通文字"
            ),
            [
                {
                    type: "paragraph",
                    text:
                        "### 未支持标题 普通文字"
                }
            ]
        );
    }
);

test(
    "空正文返回空块数组",
    () => {
        assert.deepEqual(
            parseDetailBody(" \r\n "),
            []
        );
    }
);
```

说明：测试通过 `data:` URL 加载 ES Module，因此不需要新增 `package.json`，也不会改变现有 `.cjs` 脚本行为。

- [ ] **Step 2: 运行测试并确认先失败**

运行：

```bat
node --test tests\detail-body-parser.test.mjs
```

预期：

```text
FAIL
ENOENT: no such file or directory, open '...\assets\js\detail-body-parser.js'
```

- [ ] **Step 3: 编写最小且完整的解析器**

创建 `assets/js/detail-body-parser.js`：

```javascript
const HEADING_PATTERN =
    /^##\s+(.+)$/;

const QUOTE_PATTERN =
    /^>\s?(.*)$/;

const LIST_PATTERN =
    /^-\s+(.+)$/;

const REFERENCE_PATTERN =
    /^\[(\d+)\]\s+(.+)$/;

function normalizeSource(source) {
    return String(source ?? "")
        .replace(/\r\n?/g, "\n")
        .trim();
}

function isSpecialLine(line) {
    return HEADING_PATTERN.test(line) ||
        QUOTE_PATTERN.test(line) ||
        LIST_PATTERN.test(line);
}

export function parseDetailBody(
    source
) {
    const normalized =
        normalizeSource(source);

    if (!normalized) {
        return [];
    }

    const lines =
        normalized.split("\n");

    const blocks = [];
    let index = 0;
    let inReferenceSection = false;

    while (index < lines.length) {
        const line =
            lines[index].trim();

        if (!line) {
            index += 1;
            continue;
        }

        const headingMatch =
            line.match(
                HEADING_PATTERN
            );

        if (headingMatch) {
            const text =
                headingMatch[1].trim();

            inReferenceSection =
                text === "参考资料";

            blocks.push({
                type: "heading",
                text,
                isReferenceHeading:
                    inReferenceSection
            });

            index += 1;
            continue;
        }

        if (inReferenceSection) {
            const referenceMatch =
                line.match(
                    REFERENCE_PATTERN
                );

            if (referenceMatch) {
                blocks.push({
                    type: "reference",
                    number:
                        referenceMatch[1],
                    text:
                        referenceMatch[2]
                            .trim()
                });

                index += 1;
                continue;
            }
        }

        const quoteMatch =
            line.match(
                QUOTE_PATTERN
            );

        if (quoteMatch) {
            const quoteLines = [];

            while (
                index < lines.length
            ) {
                const current =
                    lines[index].trim();

                const currentMatch =
                    current.match(
                        QUOTE_PATTERN
                    );

                if (!currentMatch) {
                    break;
                }

                quoteLines.push(
                    currentMatch[1]
                        .trim()
                );

                index += 1;
            }

            blocks.push({
                type: "quote",
                lines: quoteLines
            });

            continue;
        }

        const listMatch =
            line.match(
                LIST_PATTERN
            );

        if (listMatch) {
            const items = [];

            while (
                index < lines.length
            ) {
                const current =
                    lines[index].trim();

                const currentMatch =
                    current.match(
                        LIST_PATTERN
                    );

                if (!currentMatch) {
                    break;
                }

                items.push(
                    currentMatch[1]
                        .trim()
                );

                index += 1;
            }

            blocks.push({
                type: "list",
                items
            });

            continue;
        }

        const paragraphLines = [
            line
        ];

        index += 1;

        while (index < lines.length) {
            const current =
                lines[index].trim();

            if (
                !current ||
                isSpecialLine(current)
            ) {
                break;
            }

            if (
                inReferenceSection &&
                REFERENCE_PATTERN.test(
                    current
                )
            ) {
                break;
            }

            paragraphLines.push(
                current
            );

            index += 1;
        }

        blocks.push({
            type: "paragraph",
            text:
                paragraphLines.join(" ")
        });
    }

    return blocks;
}

export function collectReferenceNumbers(
    blocks
) {
    return new Set(
        blocks
            .filter(
                (block) =>
                    block.type ===
                    "reference"
            )
            .map(
                (block) =>
                    String(block.number)
            )
    );
}
```

- [ ] **Step 4: 运行解析器测试**

```bat
node --test tests\detail-body-parser.test.mjs
```

预期：

```text
tests 4
pass 4
fail 0
```

- [ ] **Step 5: 检查浏览器模块语法**

```bat
node --check assets\js\detail-body-parser.js
```

预期：命令无输出并返回成功。

- [ ] **Step 6: 提交解析器**

```bat
git add assets/js/detail-body-parser.js tests/detail-body-parser.test.mjs
git commit -m "Add tested detail body parser"
```

---

### Task 2: 将结构化正文安全接入通用详情页

**Files:**
- Modify: `assets/js/detail.js:1-610`
- Modify: `detail.html:219-251`
- Test: `tests/detail-body-parser.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `parseDetailBody()` 和 `collectReferenceNumbers()`。
- Produces: `renderBody(body, container)`，安全渲染章节、引文、列表、来源编号与资料链接。
- Produces: 文章类型类名 `detail-article--works|articles|gallery`。
- Produces: `[data-detail-image-credit]` 图片说明容器。

- [ ] **Step 1: 在 `detail.js` 顶部导入解析器**

在现有两个 `import` 之后加入：

```javascript
import {
    collectReferenceNumbers,
    parseDetailBody
} from "./detail-body-parser.js";
```

- [ ] **Step 2: 扩展作品档案字段**

把 `METADATA_CONFIG.works` 替换为：

```javascript
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
```

图片来源字段不加入该列表，避免与专门的授权区重复。

- [ ] **Step 3: 用安全结构化渲染替换旧 `renderBody`**

删除当前 `detail.js:190-228` 的旧 `renderBody`，在相同位置加入：

```javascript
const INLINE_TOKEN_PATTERN =
    /https:\/\/[^\s<>()]+|\[(\d+)\]/g;

function appendInlineContent(
    container,
    text,
    referenceNumbers,
    citationState
) {
    let cursor = 0;

    for (
        const match of
        String(text).matchAll(
            INLINE_TOKEN_PATTERN
        )
    ) {
        const token = match[0];
        const start = match.index ?? 0;

        if (start > cursor) {
            container.append(
                document.createTextNode(
                    String(text).slice(
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

    if (cursor < String(text).length) {
        container.append(
            document.createTextNode(
                String(text).slice(cursor)
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
```

- [ ] **Step 4: 在详情 HTML 中增加图片授权容器**

在 `detail.html` 的 `data-detail-image-wrapper` 结束标签之后、`detail-meta-title` 之前加入：

```html
<div
    class="detail-image-credit"
    data-detail-image-credit
    hidden
></div>
```

- [ ] **Step 5: 在 `detail.js` 加入内容类型和图片授权渲染**

在 `renderImage` 之前加入：

```javascript
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
```

- [ ] **Step 6: 替换 `renderImage`，为作品提供封面回退**

把现有 `renderImage` 全部替换为：

```javascript
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
                `《${item.title}》\n本站原创视觉封面`
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
```

- [ ] **Step 7: 在 `renderContent` 中接入类型类名和授权说明**

在读取 `pageConfig` 后立即加入：

```javascript
applyContentTypeClass(
    elements.article,
    item.content_type
);
```

在 `renderImage(...)` 之后加入：

```javascript
renderImageCredit(
    item,
    elements.imageCredit
);
```

- [ ] **Step 8: 在元素表中加入图片授权节点**

在 `initializeDetailPage()` 的 `elements` 对象中，紧接 `imagePlaceholder` 后加入：

```javascript
imageCredit:
    document.querySelector(
        "[data-detail-image-credit]"
    )
```

并确保前一个属性末尾有逗号。

- [ ] **Step 9: 运行自动检查**

```bat
node --check assets\js\detail-body-parser.js
node --check assets\js\detail.js
node --test tests\detail-body-parser.test.mjs
```

预期：两个语法检查无输出，测试 `pass 4 / fail 0`。

- [ ] **Step 10: 本地验证旧内容兼容**

在本地服务器依次打开：

```text
detail.html?type=works&id=aq-zhengzhuan
detail.html?type=articles&id=kuangren-riji-reading
detail.html?type=gallery&id=lu-xun-portrait
```

实际 slug 与本地数据不一致时，从列表页点击进入。预期：

- 旧正文仍显示为普通段落。
- 赏析详情仍显示作者等元数据。
- 影像详情仍保持大图，不出现 3:4 封面样式。
- 控制台无未捕获异常。

- [ ] **Step 11: 提交详情页逻辑**

```bat
git add detail.html assets/js/detail.js
git commit -m "Render structured detail content safely"
```

---

### Task 3: 添加作品档案首屏与结构化正文样式

**Files:**
- Modify: `assets/css/detail.css:64-316`
- Create: `assets/images/works/kuangren-riji-cover.svg`

**Interfaces:**
- Consumes: Task 2 生成的 `detail-article--works`、`detail-section-heading`、`detail-quote`、`detail-key-points`、`detail-references` 和图片授权类名。
- Produces: 桌面双列作品档案、平板单列布局、375×812 安全阅读样式。
- Produces: 900×1200 的 3:4 本站原创 SVG 封面。

- [ ] **Step 1: 先创建原创 SVG 封面**

创建目录：

```bat
mkdir assets\images\works
```

创建 `assets/images/works/kuangren-riji-cover.svg`：

```svg
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="900"
    height="1200"
    viewBox="0 0 900 1200"
    role="img"
    aria-labelledby="title description"
>
    <title id="title">《狂人日记》原创视觉封面</title>
    <desc id="description">
        米白纸张、暗红边框、黑色竖排书名与红色印章组成的民国书刊风格封面
    </desc>

    <defs>
        <pattern
            id="paper"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
        >
            <rect
                width="28"
                height="28"
                fill="#f3ead8"
            />
            <circle
                cx="5"
                cy="8"
                r="0.8"
                fill="#8b765f"
                opacity="0.16"
            />
            <circle
                cx="21"
                cy="19"
                r="0.7"
                fill="#8b765f"
                opacity="0.12"
            />
        </pattern>
    </defs>

    <rect
        width="900"
        height="1200"
        fill="url(#paper)"
    />

    <rect
        x="48"
        y="48"
        width="804"
        height="1104"
        fill="none"
        stroke="#8d1f1f"
        stroke-width="4"
    />

    <rect
        x="76"
        y="76"
        width="748"
        height="1048"
        fill="none"
        stroke="#8d1f1f"
        stroke-width="1.5"
        opacity="0.72"
    />

    <path
        d="M130 170 H770"
        stroke="#1f1c19"
        stroke-width="2"
        opacity="0.36"
    />

    <text
        x="450"
        y="150"
        text-anchor="middle"
        font-family="Georgia, serif"
        font-size="28"
        letter-spacing="8"
        fill="#8d1f1f"
    >
        SELECTED WORKS · 1918
    </text>

    <text
        x="548"
        y="340"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="118"
        font-weight="700"
        fill="#201d1a"
    >
        狂
    </text>

    <text
        x="548"
        y="490"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="118"
        font-weight="700"
        fill="#201d1a"
    >
        人
    </text>

    <text
        x="548"
        y="640"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="118"
        font-weight="700"
        fill="#201d1a"
    >
        日
    </text>

    <text
        x="548"
        y="790"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="118"
        font-weight="700"
        fill="#201d1a"
    >
        记
    </text>

    <line
        x1="360"
        y1="270"
        x2="360"
        y2="860"
        stroke="#8d1f1f"
        stroke-width="3"
    />

    <text
        x="278"
        y="350"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="42"
        fill="#4d4640"
    >
        鲁
    </text>

    <text
        x="278"
        y="420"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="42"
        fill="#4d4640"
    >
        迅
    </text>

    <text
        x="278"
        y="540"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="24"
        letter-spacing="5"
        fill="#6b5e54"
    >
        短篇小说
    </text>

    <rect
        x="235"
        y="760"
        width="86"
        height="86"
        rx="5"
        fill="#8d1f1f"
    />

    <text
        x="278"
        y="813"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="23"
        fill="#fffaf0"
    >
        横眉
    </text>

    <text
        x="450"
        y="1038"
        text-anchor="middle"
        font-family="'Songti SC','SimSun',serif"
        font-size="24"
        letter-spacing="6"
        fill="#4d4640"
    >
        本站原创视觉封面
    </text>

    <path
        d="M130 1080 H770"
        stroke="#1f1c19"
        stroke-width="2"
        opacity="0.36"
    />
</svg>
```

- [ ] **Step 2: 在 `detail.css` 的通用规则中修复标题操作区**

在 `.detail-summary` 之后加入：

```css
.detail-heading-actions {
    position: relative;
    z-index: 1;
    margin-top: 28px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}
```

删除当前仅位于 `@media (max-width: 520px)` 内的重复 `.detail-heading-actions` 规则。

- [ ] **Step 3: 在文件末尾追加结构化正文和作品样式**

把以下内容追加到 `assets/css/detail.css` 末尾：

```css
/* ========================================
   结构化长文正文
   ======================================== */

.detail-body--structured {
    max-width: 780px;
    margin: 0 auto;
}

.detail-section-heading {
    position: relative;
    margin: 52px 0 24px;
    padding-left: 22px;
    font-family: var(--font-serif);
    font-size: 29px;
    line-height: 1.45;
    letter-spacing: 2px;
}

.detail-section-heading:first-child {
    margin-top: 0;
}

.detail-section-heading::before {
    content: "";
    position: absolute;
    top: 0.22em;
    bottom: 0.22em;
    left: 0;
    width: 4px;
    border-radius: 999px;
    background: var(--color-red);
}

.detail-quote {
    margin: 30px 0;
    padding: 26px 30px;
    border-left: 4px solid var(--color-red);
    background: rgba(141, 31, 31, 0.055);
}

.detail-quote-text {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 20px;
    line-height: 2;
    text-align: left;
}

.detail-quote-source {
    display: block;
    margin-top: 14px;
    color: var(--color-ink-soft);
    font-size: 14px;
    font-style: normal;
    text-align: right;
}

.detail-key-points {
    margin: 8px 0 28px;
    padding: 22px 26px 22px 48px;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.34);
}

.detail-key-points li {
    margin: 10px 0;
    padding-left: 4px;
    line-height: 1.9;
}

.detail-key-points li::marker {
    color: var(--color-red);
}

.detail-citation {
    margin-left: 2px;
    font-size: 0.72em;
    line-height: 0;
}

.detail-citation a {
    color: var(--color-red);
    font-weight: bold;
}

.detail-external-link {
    color: var(--color-red);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    overflow-wrap: anywhere;
}

.detail-references {
    margin-top: 64px;
    padding-top: 10px;
    border-top: 1px solid var(--color-border);
}

.detail-reference-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.detail-reference-item {
    scroll-margin-top: 120px;
    margin: 0 0 18px;
    padding: 18px 20px;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.3);
    line-height: 1.9;
    overflow-wrap: anywhere;
}

.detail-reference-marker {
    margin-right: 8px;
    color: var(--color-red);
    font-weight: bold;
}

.detail-reference-back {
    margin-left: 12px;
    color: var(--color-red);
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
}

.detail-reference-note {
    color: var(--color-ink-soft);
    font-size: 14px;
}

.detail-citation a,
.detail-reference-item {
    scroll-margin-top: 120px;
}

/* ========================================
   图片说明与授权
   ======================================== */

.detail-image-credit {
    margin-bottom: 30px;
    padding: 16px;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.34);
}

.detail-image-credit[hidden] {
    display: none;
}

.detail-image-credit-title {
    display: block;
    color: var(--color-red);
    font-size: 13px;
    letter-spacing: 1px;
}

.detail-image-credit-list {
    margin-top: 12px;
}

.detail-image-credit-row {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 10px;
    padding: 7px 0;
    border-top: 1px solid rgba(141, 31, 31, 0.1);
    font-size: 12px;
    line-height: 1.6;
}

.detail-image-credit-row dt {
    color: var(--color-ink-soft);
}

.detail-image-credit-row dd {
    min-width: 0;
    overflow-wrap: anywhere;
}

/* ========================================
   代表作品档案布局
   ======================================== */

.detail-article--works {
    display: grid;
    grid-template-columns:
        minmax(250px, 0.34fr)
        minmax(0, 0.66fr);
}

.detail-article--works
.detail-heading {
    grid-column: 2;
    grid-row: 1;
}

.detail-article--works
.detail-layout {
    display: contents;
}

.detail-article--works
.detail-sidebar {
    grid-column: 1;
    grid-row: 1 / span 2;
}

.detail-article--works
.detail-content {
    grid-column: 2;
    grid-row: 2;
    border-top: 1px solid var(--color-border);
}

.detail-article--works
.detail-image-wrapper {
    max-width: 320px;
    margin-right: auto;
    margin-left: auto;
    background: #f3ead8;
}

.detail-image--cover {
    aspect-ratio: 3 / 4;
    min-height: 0;
    object-fit: contain;
    background: #f3ead8;
}

.detail-image-placeholder--cover {
    aspect-ratio: 3 / 4;
    min-height: 0;
    padding: 24px;
    white-space: pre-line;
    background:
        linear-gradient(
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.1)
        ),
        #f3ead8;
}

@media (max-width: 900px) {
    .detail-article--works {
        display: block;
    }

    .detail-article--works
    .detail-layout {
        display: grid;
        grid-template-columns: 1fr;
    }

    .detail-article--works
    .detail-sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--color-border);
    }

    .detail-article--works
    .detail-content {
        border-top: 0;
    }

    .detail-article--works
    .detail-image-wrapper {
        width: min(62vw, 300px);
    }
}

@media (max-width: 520px) {
    .detail-section-heading {
        margin-top: 42px;
        padding-left: 17px;
        font-size: 24px;
        letter-spacing: 1px;
    }

    .detail-quote {
        padding: 21px 19px;
    }

    .detail-quote-text {
        font-size: 18px;
    }

    .detail-key-points {
        padding:
            17px 17px
            17px 38px;
    }

    .detail-reference-item {
        padding: 15px 16px;
        font-size: 14px;
    }

    .detail-reference-back {
        display: inline-block;
        margin: 8px 0 0;
    }

    .detail-image-credit-row {
        grid-template-columns: 1fr;
        gap: 3px;
    }
}
```

- [ ] **Step 4: 检查 CSS 与资源路径**

```bat
findstr /n /c:"detail-article--works" assets\css\detail.css
findstr /n /c:"detail-section-heading" assets\css\detail.css
dir assets\images\works\kuangren-riji-cover.svg
```

预期：两个选择器都有行号，SVG 文件存在且大小大于 1 KB。

- [ ] **Step 5: 暂不提交，等待样板数据测试一起完成**

Task 3 和 Task 4 的视觉资源与内容必须同一提交，避免线上短暂出现封面但无完整正文的状态。

---

### Task 4: 写入《狂人日记》完整内容并建立内容约束测试

**Files:**
- Create: `tests/kuangren-sample.test.cjs`
- Modify: `assets/data/works.json`
- Create: `docs/鲁迅代表作品图片来源与授权登记.md`
- Include from Task 3: `assets/images/works/kuangren-riji-cover.svg`
- Modify by command: `supabase/migrations/003_seed_initial_contents.sql`

**Interfaces:**
- Consumes: 现有 `works.json` 六条数组结构。
- Produces: 唯一 `works/kuangren-riji` 样板记录。
- Produces: 供云端迁移生成器读取的权威数据。
- Produces: 可核验的正文长度、章节、引文、资料和图片授权元数据。

- [ ] **Step 1: 先写内容约束测试**

创建 `tests/kuangren-sample.test.cjs`：

```javascript
const test =
    require("node:test");

const assert =
    require("node:assert/strict");

const fs =
    require("node:fs");

const path =
    require("node:path");

const projectRoot =
    path.resolve(__dirname, "..");

const worksPath =
    path.join(
        projectRoot,
        "assets",
        "data",
        "works.json"
    );

function readWorks() {
    return JSON.parse(
        fs.readFileSync(
            worksPath,
            "utf8"
        )
    );
}

test(
    "作品馆藏仍保持六条且编号唯一",
    () => {
        const works = readWorks();

        assert.equal(
            works.length,
            6
        );

        assert.equal(
            new Set(
                works.map(
                    (item) =>
                        item.slug
                )
            ).size,
            6
        );
    }
);

test(
    "狂人日记样板满足正文结构要求",
    () => {
        const item =
            readWorks().find(
                (record) =>
                    record.slug ===
                    "kuangren-riji"
            );

        assert.ok(item);

        const chineseCount =
            [
                ...item.body
            ].filter(
                (character) =>
                    /[\u4e00-\u9fff]/u
                        .test(character)
            ).length;

        assert.ok(
            chineseCount >= 1400,
            `中文字符过少：${chineseCount}`
        );

        assert.ok(
            chineseCount <= 1800,
            `中文字符过多：${chineseCount}`
        );

        const headings =
            [
                ...item.body.matchAll(
                    /^##\s+(.+)$/gm
                )
            ].map(
                (match) =>
                    match[1]
            );

        assert.deepEqual(
            headings,
            [
                "作品导读",
                "创作与发表背景",
                "内容概述",
                "主要人物与叙述视角",
                "核心主题",
                "艺术特色",
                "文学史影响",
                "参考资料"
            ]
        );

        const quoteCount =
            (
                item.body.match(
                    /^>\s+(?!——)/gm
                ) ?? []
            ).length;

        assert.equal(
            quoteCount,
            2
        );

        const referenceCount =
            (
                item.body.match(
                    /^\[\d+\]\s+/gm
                ) ?? []
            ).length;

        assert.equal(
            referenceCount,
            5
        );
    }
);

test(
    "狂人日记封面和授权元数据完整",
    () => {
        const item =
            readWorks().find(
                (record) =>
                    record.slug ===
                    "kuangren-riji"
            );

        const imagePath =
            path.join(
                projectRoot,
                ...item.image_path.split("/")
            );

        assert.ok(
            fs.existsSync(
                imagePath
            )
        );

        assert.equal(
            item.metadata.image_type,
            "original"
        );

        [
            "image_caption",
            "image_creator",
            "image_date",
            "image_source",
            "image_license",
            "image_alt"
        ].forEach(
            (field) => {
                assert.equal(
                    typeof item.metadata[
                        field
                    ],
                    "string"
                );

                assert.ok(
                    item.metadata[
                        field
                    ].trim()
                );
            }
        );
    }
);
```

- [ ] **Step 2: 运行测试并确认旧数据失败**

```bat
node --test tests\kuangren-sample.test.cjs
```

预期：

- “作品馆藏仍保持六条且编号唯一”通过。
- 正文结构测试失败，因为旧正文没有八个章节。
- 封面测试失败，因为旧 `image_path` 为 `null`。

- [ ] **Step 3: 用以下对象替换 `works.json` 第一条记录**

```json
{
    "content_type": "works",
    "slug": "kuangren-riji",
    "title": "狂人日记",
    "summary": "作品以一位被视为“患病者”的日记为中心，通过“吃人”的象征、双重叙述与不可靠视角，审视礼教秩序、群体冷漠和个体觉醒的代价。",
    "body": "## 作品导读\n\n《狂人日记》写于新文化运动兴起之际，1918年5月刊于《新青年》第四卷第五号，并首次使用“鲁迅”这一笔名。它常被视为中国现代白话小说的重要开端，但价值并不只在“第一篇”这一标签。鲁迅借一个被家人和乡人认作“患病”的人的眼睛，重新审视日常生活、伦理秩序和历史记忆：越是被社会判定为荒唐的声音，越可能触及多数人不愿承认的事实。读者因此同时面对两种判断——狂人的恐惧是否源于病症，以及他关于“吃人”的发现是否揭示了真实的社会结构。[1][4]\n\n## 创作与发表背景\n\n鲁迅当时在北京教育部任职，并长期居住在绍兴会馆。钱玄同等《新青年》同人劝他重新写作，后来被概括为《〈呐喊〉自序》中关于“铁屋子”的对话。鲁迅并不确信少数清醒者能否改变沉睡的人群，却也承认不能抹杀尚未发生的希望，于是写下《狂人日记》，此后陆续创作了收入《呐喊》的多篇小说。[2] 作品发表于1918年5月，其文言小序模拟整理病历的客观口吻，十三则日记则主要采用白话，由两种语言和两种观察立场共同构成文本。[1][4] 1923年，《狂人日记》收入新潮社初版《呐喊》，由单篇杂志作品进入鲁迅第一部小说集的整体结构。[5]\n\n## 内容概述\n\n小说开头由一位文言叙述者说明：昔日友人的弟弟曾患“迫害狂”，病愈后外出候补，留下两册日记。正文随即进入狂人的第一人称世界。他从月光、犬吠、路人的目光和孩子的议论中感到危险，继而怀疑赵贵翁、医生、母亲乃至自己的大哥都参与了“吃人”的秩序。随着阅读历史和回忆往事，他把零散恐惧组织成一个判断：表面写着仁义道德的历史，字缝里却隐藏着“吃人”。到结尾，他又怀疑自己也可能参与过这种秩序。日记没有给出胜利，而以对下一代的呼喊结束。文言小序却说狂人已经“早愈”，并去候补做官；这种看似恢复正常的结局，使读者反过来追问：究竟谁才是真正清醒的人？\n\n> 凡事总须研究，才会明白。\n> ——《狂人日记》\n\n## 主要人物与叙述视角\n\n狂人既是故事人物，也是整篇小说的感知中心。他高度敏感、不断联想，叙述显然带有迫害妄想的特征，因此读者不能把每个细节都当作客观事实；但他的“不可靠”并不等于他的判断毫无意义。恰恰因为他脱离了习以为常的解释方式，普通人的目光、劝说和沉默才显出压迫性。大哥代表家族权威和伦理秩序，赵贵翁、医生、街上的人以及围观的孩子形成层层扩散的社会环境。他们未必真要伤害狂人，却共同维护不容质疑的生活方式。文言小序的整理者则站在所谓正常社会一边，以冷静分类的方式把狂人的语言变成“病例”。小说由此形成双重叙述：表层是一个病人的日记，深层则是被判为病态的个人对正常秩序的审问。\n\n## 核心主题\n\n作品最著名的“吃人”并非单一事件，而是一种象征结构。它指向以仁义道德为名、实际牺牲个人尊严的伦理关系，也指向人们在服从和围观中成为秩序的一部分。狂人最初把自己看成受害者，后来却想到自己可能吃过妹妹的肉，这一转折使批判不再停留于“坏人迫害好人”，而进入更困难的自我反省：身处旧秩序的人，即使并无明确恶意，也可能继承并重复伤害。[1]\n\n- “吃人”揭示礼教话语与现实伤害之间的裂缝。\n- 狂人的觉醒带来清醒，也带来无法与多数人沟通的孤独。\n- 从控诉他人转向怀疑自己，使作品具有持续的伦理压力。\n- 对孩子的呼喊把希望交给尚未完全被旧秩序塑造的未来。\n\n> 救救孩子……\n> ——《狂人日记》\n\n## 艺术特色\n\n小说首先以“格式的特别”制造阅读张力。文言小序像档案、病案或出版说明，努力建立可靠的外部框架；白话日记则破碎、跳跃、重复，贴近人物不断加速的心理活动。两种文体并置，使“正常”与“疯狂”不再是简单答案，而成为需要读者判断的问题。[4] 其次，作品大量使用日常细节的陌生化：月光、狗、眼神、看病和劝食本来都很普通，经狂人的意识重新组合后，却显露出威胁。再次，“吃人”把历史、家庭和个人经验联结起来，既指向具体压迫，也容纳文化反思。小说还使用反讽：狂人被宣布“病愈”并重新进入仕途，看似是秩序恢复，实际上可能意味着批判声音被重新收编。短促句式、疑问、重复和突然转折共同形成紧张节奏，使思想判断不是抽象议论，而成为一种逼近读者的精神体验。\n\n## 文学史影响\n\n《狂人日记》的发表把白话文、现代小说形式和社会批判集中在一篇短篇作品中，成为新文学早期极具标志性的创作成果。它不是简单把文言改成白话，而是改变了小说观察人的方式：人物的心理、叙述的可靠性以及读者的判断都成为作品结构的一部分。鲁迅后来说明，自己写小说并非为了进入传统意义上的“文苑”，而是希望利用文学的力量改良社会。[3] 这一创作立场也解释了作品为何既重视形式实验，又始终把人的处境放在中心。今天重读《狂人日记》，重要的不只是辨认“吃人”对应哪一种历史制度，更是检查我们是否在熟悉的语言、规则和群体判断中忽略了具体的人。\n\n## 参考资料\n\n[1] 鲁迅：《狂人日记》（1918年《新青年》版本），维基文库。https://zh.wikisource.org/zh-hans/狂人日记_(1918年本)\n\n[2] 鲁迅：《呐喊·自序》，维基文库。https://zh.wikisource.org/zh-hans/呐喊\n\n[3] 鲁迅：《我怎么做起小说来？》，维基文库。https://zh.wikisource.org/zh-hans/我怎麼做起小說來？\n\n[4] 姜异新：《重读〈狂人日记〉：约稿·创作·发表·冷遇》，中国作家网，2022年3月30日。https://www.chinawriter.com.cn/n1/2022/0330/c419384-32387494.html\n\n[5] 唐文一：《鲁迅的处女作小说集〈呐喊〉》，中国作家网，2021年9月22日。https://www.chinawriter.com.cn/n1/2021/0922/c419387-32233145.html",
    "image_path": "assets/images/works/kuangren-riji-cover.svg",
    "metadata": {
        "year": "1918",
        "genre": "短篇小说",
        "collection": "《呐喊》",
        "first_published": "《新青年》第四卷第五号（1918年5月）",
        "creation_place": "北京",
        "keywords": [
            "吃人",
            "礼教",
            "觉醒",
            "不可靠叙述",
            "救救孩子"
        ],
        "image_type": "original",
        "image_caption": "《狂人日记》本站原创视觉封面",
        "image_creator": "横眉·鲁迅文化数字展馆",
        "image_date": "2026",
        "image_source": "本站原创",
        "image_license": "本站原创，仅用于本课程项目与项目展示",
        "image_alt": "米白色民国书刊风格的《狂人日记》原创文字封面"
    },
    "status": "published",
    "sort_order": 10
}
```

其余五条记录保持原顺序、原 slug、原正文和原排序不变。

- [ ] **Step 4: 创建图片来源与授权登记**

创建 `docs/鲁迅代表作品图片来源与授权登记.md`：

```markdown
# 鲁迅代表作品图片来源与授权登记

## 登记原则

本目录只登记已实际用于“代表作品”栏目及其详情页的图片。图片必须属于公共领域、明确的开放许可、机构明确允许展示的资料，或本站原创视觉素材。来源与授权状态不明确的网络图片不进入项目。

## 已使用图片

| 文件 | 作品 | 类型 | 作者或设计 | 年代 | 来源 | 授权与使用说明 | alt |
|---|---|---|---|---|---|---|---|
| `assets/images/works/kuangren-riji-cover.svg` | 《狂人日记》 | 本站原创视觉封面 | 横眉·鲁迅文化数字展馆 | 2026 | 本项目原创 SVG | 仅用于《数据技术实训》课程项目、GitHub 仓库和项目展示；不得冒充历史版本书影 | 米白色民国书刊风格的《狂人日记》原创文字封面 |

## 设计说明

《狂人日记》封面采用米白纸张、暗红双线边框、黑色书名与红色“横眉”印章元素。该图不复刻任何具体出版社的历史封面，也不声称属于《新青年》或《呐喊》的原始版本。详情页必须显示“本站原创视觉封面”及对应使用说明。
```

- [ ] **Step 5: 运行内容测试**

```bat
node --test tests\kuangren-sample.test.cjs
```

预期：

```text
tests 3
pass 3
fail 0
```

- [ ] **Step 6: 生成新的初始种子文件**

```bat
node scripts\generate-seed-sql.cjs
```

预期：

```text
数据验证通过。
内容总数：18
```

确认 `supabase/migrations/003_seed_initial_contents.sql` 发生变化。

该文件只用于新建数据库。不要把更新后的 `003_seed_initial_contents.sql` 粘贴到已经运行中的 Supabase 项目。

- [ ] **Step 7: 运行详情解析与内容测试**

```bat
node --test tests\detail-body-parser.test.mjs tests\kuangren-sample.test.cjs
node --check assets\js\detail.js
```

预期：

```text
tests 7
pass 7
fail 0
```

- [ ] **Step 8: 本地打开《狂人日记》详情**

```text
http://localhost/.../detail.html?type=works&id=kuangren-riji
```

检查：

- 封面显示完整，不裁切。
- “本站原创视觉封面”说明可见。
- 八个章节按顺序显示。
- 两个短引为引用框。
- 四个主题要点为列表。
- 正文 `[1]` 可跳到资料 1。
- 资料中的 URL 可在新标签页打开。
- “返回正文”回到第一次引用。
- 收藏按钮仍正常。

- [ ] **Step 9: 检查 375×812**

使用 Chrome 设备模拟：

```text
宽度：375
高度：812
缩放：100%
```

检查：

- 封面居中，宽度不超过页面。
- 页面没有横向滚动条。
- 章节标题、引用框、列表和长 URL 均不越界。
- 顶部导航、搜索和账号区域保持原有响应式行为。

- [ ] **Step 10: 提交样板内容和视觉**

```bat
git add assets/css/detail.css assets/images/works/kuangren-riji-cover.svg assets/data/works.json docs/鲁迅代表作品图片来源与授权登记.md tests/kuangren-sample.test.cjs supabase/migrations/003_seed_initial_contents.sql
git commit -m "Add Kuangren Riji sample content and cover"
```

---

### Task 5: 建立单条 Supabase 内容迁移生成器

**Files:**
- Create: `tests/generate-single-content-migration.test.cjs`
- Create: `scripts/generate-single-content-migration.cjs`
- Generate: `supabase/migrations/011_update_kuangren_riji_sample.sql`

**Interfaces:**
- Consumes: `contentType`、`slug` 和输出文件名。
- Consumes: `assets/data/<contentType>.json` 中恰好一条目标记录。
- Produces: `createMigrationSql(record): string`。
- Produces: 一个只更新 `summary`、`body`、`image_path`、`metadata`、`updated_at` 的 SQL 迁移。
- SQL 在目标记录不存在、已软删除或出现异常多行时抛错并回滚。

- [ ] **Step 1: 先写迁移生成器测试**

创建 `tests/generate-single-content-migration.test.cjs`：

```javascript
const test =
    require("node:test");

const assert =
    require("node:assert/strict");

const {
    createMigrationSql,
    findRecord
} = require(
    "../scripts/generate-single-content-migration.cjs"
);

test(
    "只找到指定类型和 slug 的唯一记录",
    () => {
        const records = [
            {
                content_type: "works",
                slug: "kuangren-riji"
            },
            {
                content_type: "works",
                slug: "guxiang"
            }
        ];

        assert.deepEqual(
            findRecord(
                records,
                "works",
                "kuangren-riji"
            ),
            records[0]
        );

        assert.throws(
            () =>
                findRecord(
                    records,
                    "works",
                    "missing"
                ),
            /应恰好匹配 1 条/
        );
    }
);

test(
    "生成的 SQL 不修改状态、排序和其他内容",
    () => {
        const sql =
            createMigrationSql({
                content_type: "works",
                slug: "kuangren-riji",
                summary: "摘要",
                body: "正文",
                image_path:
                    "assets/images/works/cover.svg",
                metadata: {
                    year: "1918"
                }
            });

        assert.match(
            sql,
            /where target\.content_type = 'works'/
        );

        assert.match(
            sql,
            /and target\.slug = 'kuangren-riji'/
        );

        assert.match(
            sql,
            /get diagnostics v_updated = row_count/
        );

        assert.match(
            sql,
            /if v_updated <> 1/
        );

        assert.doesNotMatch(
            sql,
            /status\s*=/
        );

        assert.doesNotMatch(
            sql,
            /sort_order\s*=/
        );

        assert.doesNotMatch(
            sql,
            /insert into public\.contents/
        );
    }
);
```

- [ ] **Step 2: 运行测试并确认先失败**

```bat
node --test tests\generate-single-content-migration.test.cjs
```

预期：失败，提示找不到 `scripts/generate-single-content-migration.cjs`。

- [ ] **Step 3: 创建迁移生成器**

创建 `scripts/generate-single-content-migration.cjs`：

```javascript
const fs =
    require("node:fs");

const path =
    require("node:path");

const projectRoot =
    path.resolve(__dirname, "..");

function escapeSqlLiteral(value) {
    return String(value)
        .replace(/'/g, "''");
}

function findRecord(
    records,
    contentType,
    slug
) {
    const matches =
        records.filter(
            (record) =>
                record.content_type ===
                    contentType &&
                record.slug === slug
        );

    if (matches.length !== 1) {
        throw new Error(
            `${contentType}:${slug} ` +
            `应恰好匹配 1 条，当前为 ` +
            `${matches.length} 条。`
        );
    }

    return matches[0];
}

function createMigrationSql(
    record
) {
    const payload = {
        summary:
            record.summary,
        body:
            record.body,
        image_path:
            record.image_path,
        metadata:
            record.metadata
    };

    const jsonText =
        JSON.stringify(
            payload,
            null,
            2
        );

    const delimiter =
        "$content_update$";

    if (jsonText.includes(delimiter)) {
        throw new Error(
            "内容中出现 SQL 分隔符。"
        );
    }

    const contentType =
        escapeSqlLiteral(
            record.content_type
        );

    const slug =
        escapeSqlLiteral(
            record.slug
        );

    return `begin;

do $migration$
declare
    v_payload jsonb :=
$content_update$
${jsonText}
$content_update$::jsonb;

    v_updated integer;
begin
    update public.contents as target
    set
        summary =
            v_payload ->> 'summary',

        body =
            v_payload ->> 'body',

        image_path =
            nullif(
                v_payload ->> 'image_path',
                ''
            ),

        metadata =
            coalesce(
                target.metadata,
                '{}'::jsonb
            )
            ||
            coalesce(
                v_payload -> 'metadata',
                '{}'::jsonb
            ),

        updated_at = now()

    where target.content_type =
        '${contentType}'

      and target.slug =
        '${slug}'

      and target.deleted_at is null;

    get diagnostics
        v_updated = row_count;

    if v_updated <> 1 then
        raise exception
            'Expected exactly one active content row, updated %',
            v_updated;
    end if;
end
$migration$;

commit;
`;
}

function main() {
    const [
        contentType,
        slug,
        outputFileName
    ] = process.argv.slice(2);

    if (
        !contentType ||
        !slug ||
        !outputFileName
    ) {
        throw new Error(
            "用法：node scripts/" +
            "generate-single-content-migration.cjs " +
            "<contentType> <slug> <outputFileName>"
        );
    }

    if (
        !/^[a-z0-9-]+$/
            .test(contentType) ||
        !/^[a-z0-9-]+$/
            .test(slug)
    ) {
        throw new Error(
            "contentType 和 slug " +
            "只能包含小写字母、数字和连字符。"
        );
    }

    if (
        path.basename(
            outputFileName
        ) !== outputFileName ||
        !/^\d{3}_[a-z0-9_]+\.sql$/
            .test(outputFileName)
    ) {
        throw new Error(
            "输出文件名必须为三位编号开头的 SQL 文件名。"
        );
    }

    const dataPath =
        path.join(
            projectRoot,
            "assets",
            "data",
            `${contentType}.json`
        );

    const records =
        JSON.parse(
            fs.readFileSync(
                dataPath,
                "utf8"
            )
        );

    const record =
        findRecord(
            records,
            contentType,
            slug
        );

    const outputPath =
        path.join(
            projectRoot,
            "supabase",
            "migrations",
            outputFileName
        );

    fs.writeFileSync(
        outputPath,
        createMigrationSql(record),
        "utf8"
    );

    console.log(
        `已生成：${outputPath}`
    );
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(
            error.message
        );

        process.exitCode = 1;
    }
}

module.exports = {
    createMigrationSql,
    findRecord
};
```

- [ ] **Step 4: 运行生成器测试**

```bat
node --test tests\generate-single-content-migration.test.cjs
```

预期：

```text
tests 2
pass 2
fail 0
```

- [ ] **Step 5: 生成 011 迁移**

```bat
node scripts\generate-single-content-migration.cjs works kuangren-riji 011_update_kuangren_riji_sample.sql
```

预期：

```text
已生成：...\supabase\migrations\011_update_kuangren_riji_sample.sql
```

- [ ] **Step 6: 静态检查迁移范围**

```bat
findstr /n /c:"where target.content_type" supabase\migrations\011_update_kuangren_riji_sample.sql
findstr /n /c:"and target.slug" supabase\migrations\011_update_kuangren_riji_sample.sql
findstr /n /c:"if v_updated <> 1" supabase\migrations\011_update_kuangren_riji_sample.sql
findstr /n /c:"status =" supabase\migrations\011_update_kuangren_riji_sample.sql
findstr /n /c:"sort_order =" supabase\migrations\011_update_kuangren_riji_sample.sql
```

预期：

- 前三条有结果。
- 后两条没有结果。

- [ ] **Step 7: 在 Supabase SQL Editor 执行 011**

只复制并执行：

```text
supabase/migrations/011_update_kuangren_riji_sample.sql
```

不要执行 `003_seed_initial_contents.sql`。

执行成功后运行：

```sql
select
    content_type,
    slug,
    char_length(body) as body_length,
    metadata ->> 'image_type' as image_type,
    image_path,
    updated_at
from public.contents
where content_type = 'works'
  and slug = 'kuangren-riji';
```

预期：

- 恰好一行。
- `image_type = original`。
- `image_path = assets/images/works/kuangren-riji-cover.svg`。
- `body_length` 明显大于旧短正文。
- `updated_at` 为本次执行时间附近。

- [ ] **Step 8: 提交迁移工具和迁移**

```bat
git add scripts/generate-single-content-migration.cjs tests/generate-single-content-migration.test.cjs supabase/migrations/011_update_kuangren_riji_sample.sql
git commit -m "Add safe single-content update migration"
```

---

### Task 6: 全量验收、线上回归与文档记录

**Files:**
- Verify: all files from Tasks 1–5
- Modify only when a verified issue is found: the file responsible for that issue

**Interfaces:**
- Consumes: 完整样板、011 云端迁移和本地备用数据。
- Produces: 自动测试通过、桌面与手机截图检查通过、云端和本地一致的可复用样板。

- [ ] **Step 1: 运行所有新增测试**

```bat
node --test tests\detail-body-parser.test.mjs tests\kuangren-sample.test.cjs tests\generate-single-content-migration.test.cjs
```

预期：

```text
tests 9
pass 9
fail 0
```

- [ ] **Step 2: 运行 JavaScript 语法检查**

```bat
node --check assets\js\detail-body-parser.js
node --check assets\js\detail.js
node --check scripts\generate-single-content-migration.cjs
```

预期：三条命令都无输出并成功返回。

- [ ] **Step 3: 运行现有内容和项目验收**

```bat
node scripts\generate-seed-sql.cjs
node scripts\project-audit.cjs
```

预期：

```text
数据验证通过。
内容总数：18
自动验收通过：0 个错误，0 个警告
```

再次运行内容测试，确保重新生成 `003` 没有改变 JSON：

```bat
node --test tests\kuangren-sample.test.cjs
```

预期：`pass 3 / fail 0`。

- [ ] **Step 4: 检查 Git 变更范围**

```bat
git status
git diff --stat
```

最终变更只应包含本计划“新增文件”和“修改文件”列出的路径，以及已经确认的设计文档。不得出现：

```text
service_role
数据库密码
.env
node_modules
无关页面
```

检查敏感词：

```bat
git grep -n "service_role" -- . ":!docs/superpowers/specs/*"
```

预期：前端源代码中没有后台密钥。

- [ ] **Step 5: 本地数据源测试**

暂时让 Supabase 请求不可用，或使用浏览器离线模式重新加载详情页。

预期：

- 顶部显示“数据来源：本地备用”。
- 完整正文、SVG 封面、参考资料和收藏按钮界面正常。
- 收藏写操作在离线状态下给出原有提示，不引发页面崩溃。

恢复网络后刷新。

- [ ] **Step 6: 云端数据源测试**

打开：

```text
https://hengmei-luxun.vercel.app/detail.html?type=works&id=kuangren-riji
```

等待 Vercel 对最新提交显示 `Ready` 后按 `Ctrl + F5`。

预期：

- 顶部显示“数据来源：云端馆藏”。
- 页面内容与本地备用数据一致。
- 控制台没有 404、模块加载错误或未捕获异常。

- [ ] **Step 7: 收藏回归**

已登录状态：

1. 点击“收藏”，按钮变为红底白字“已收藏”。
2. 刷新页面，状态保持。
3. 点击“已收藏”，恢复白底红框“收藏”。
4. 打开 `favorites.html`，确认数据同步。

未登录状态：

1. 点击收藏。
2. 保持现有登录引导行为。
3. 登录后返回详情页，页面结构不丢失。

- [ ] **Step 8: 三种详情类型回归**

至少各打开一条：

```text
works
articles
gallery
```

确认：

- `works` 使用作品档案布局。
- `articles` 不显示 3:4 作品封面样式。
- `gallery` 保持历史影像大图的 `object-fit: cover` 行为。
- 三种类型的返回链接、元数据、正文和收藏均可用。

- [ ] **Step 9: 响应式验收**

在 Chrome DevTools 依次检查：

```text
1440 × 900
768 × 1024
375 × 812
```

每个尺寸确认：

- 无横向滚动条。
- 标题与封面不重叠。
- 章节标题、引文、列表和参考资料没有越界。
- 长 URL 自动换行。
- 顶部导航、搜索和账号区域保持可用。
- 375 宽度下封面约占视口 55%～65%。

- [ ] **Step 10: 最终提交与推送**

先确认工作区：

```bat
git status
```

存在因最终验收产生的必要修复时，单独提交：

```bat
git add <经过验证的修复文件>
git commit -m "Polish Kuangren Riji sample details"
```

没有新修复时不创建空提交。

推送：

```bat
git push
```

若网络重置，只重新执行：

```bat
git push
```

不要重复提交。

- [ ] **Step 11: 完成标准复核**

以下项目必须全部满足：

```text
[通过] 新增测试 9 项全部通过
[通过] project-audit 0 错误、0 警告
[通过] 正式内容仍为 18 条
[通过] 《狂人日记》中文正文 1400～1800 字符
[通过] 8 个章节、2 个短引、5 条参考资料
[通过] 原创封面和授权登记完整
[通过] 011 只更新一条云端记录
[通过] 本地备用与 Supabase 内容一致
[通过] 桌面、平板、手机无布局问题
[通过] 赏析、影像、搜索、收藏无回归
```

---

## 实施顺序与提交记录

严格按以下顺序执行，不合并测试周期：

```text
1. Add tested detail body parser
2. Render structured detail content safely
3. Add Kuangren Riji sample content and cover
4. Add safe single-content update migration
5. Polish Kuangren Riji sample details（仅在验收发现问题时）
```

## 事实与文本核对基线

实施时使用以下材料核对发表信息、作品原文短引和创作背景：

1. 鲁迅《狂人日记》1918 年《新青年》版本：  
   `https://zh.wikisource.org/zh-hans/狂人日记_(1918年本)`
2. 鲁迅《呐喊·自序》：  
   `https://zh.wikisource.org/zh-hans/呐喊`
3. 鲁迅《我怎么做起小说来？》：  
   `https://zh.wikisource.org/zh-hans/我怎麼做起小說來？`
4. 姜异新《重读〈狂人日记〉：约稿·创作·发表·冷遇》：  
   `https://www.chinawriter.com.cn/n1/2022/0330/c419384-32387494.html`
5. 唐文一《鲁迅的处女作小说集〈呐喊〉》：  
   `https://www.chinawriter.com.cn/n1/2021/0922/c419387-32233145.html`

正文中的两处原文短引固定为：

```text
凡事总须研究，才会明白。
救救孩子……
```

不得用未经核对的网络“鲁迅语录”替换。
