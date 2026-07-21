# Remaining Five Works Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将《阿Q正传》《故乡》《祝福》《朝花夕拾》《野草》完善为与《狂人日记》一致的长文详情内容，并安全同步到 Supabase。

**Architecture:** `assets/data/works.json` 继续作为唯一正文数据源，现有 `detail.html`、`detail.js` 和安全轻量标记解析器不改动。新增内容测试和批量迁移生成器，从五条作品记录生成 `013_update_remaining_works_content.sql`，再重新生成全新部署用的 `003_seed_initial_contents.sql`。

**Tech Stack:** HTML5、原生 JavaScript、Node.js `node:test`、JSON、PostgreSQL / Supabase、Git。

## Global Constraints

- 只修改《阿Q正传》《故乡》《祝福》《朝花夕拾》《野草》的正文与内容资料；《狂人日记》正文保持不变。
- 每部正文包含 1400～1800 个中文字符；字符统计只统计 `\u4E00-\u9FFF`。
- 每部恰好包含 2 个独立引文框；署名行 `> ——` 不计为新的引文。
- 《阿Q正传》《故乡》《祝福》各 5 条参考资料；《朝花夕拾》《野草》各 6 条。
- 正文只使用 `##`、`>`、`-`、普通段落、`[n]` 和网址，不写原始 HTML。
- 引文必须依据原文核对；每处只保留支撑分析所需的短句。
- 六张 WebP 原创封面及所有 `image_*` 元数据保持不变。
- 不修改 `detail.html`、`assets/js/detail.js`、`assets/js/detail-body-parser.js` 和 `assets/css/detail.css`。
- 当前 Supabase 只执行 `013_update_remaining_works_content.sql`；重新生成的 `003_seed_initial_contents.sql` 不在当前数据库执行。
- 所有网络资料核对日期统一记录为 `2026-07-21`。
- 设计文档中“4～6 个正文标题”解释为 4～6 个主要分析单元；加上固定的导读、背景、文学史与参考资料后，详情正文总标题允许为 8～12 个。

---

## File Structure

| 文件 | 责任 |
|---|---|
| `assets/data/works.json` | 五部作品的摘要、正文、内容元数据和原有图片元数据 |
| `docs/鲁迅代表作品内容资料与引用登记.md` | 五部作品短引、参考资料、核对日期和正文编号登记 |
| `tests/remaining-works-content.test.cjs` | 五部正文结构、篇幅、引用、资料和封面回归测试 |
| `scripts/generate-works-content-migration.cjs` | 从 `works.json` 提取五部作品并生成批量迁移 |
| `tests/generate-works-content-migration.test.cjs` | 批量迁移范围、事务、安全字段和确定性测试 |
| `supabase/migrations/013_update_remaining_works_content.sql` | 当前 Supabase 的五条内容更新迁移 |
| `supabase/migrations/003_seed_initial_contents.sql` | 未来全新部署的完整种子数据 |

## Confirmed Source Set

实施正文前，逐页打开并核对以下来源。作品原文用于短引和情节核对；中国作家网文章用于背景、文体和文学史分析。

### 《阿Q正传》

1. `https://zh.wikisource.org/zh-hans/阿Q正传`
2. `https://zh.wikisource.org/zh-hans/呐喊`
3. `https://zh.wikisource.org/zh-hans/我怎麼做起小說來？`
4. `https://www.chinawriter.com.cn/n1/2021/0907/c440988-32220110.html`
5. `https://www.chinawriter.com.cn/n1/2026/0105/c419384-40638789.html`

核对短引：

- “我总算被儿子打了。”
- “这些眼睛们似乎连成一气，已经在那里咬他的灵魂。”

### 《故乡》

1. `https://zh.wikisource.org/zh-hans/故鄉`
2. `https://zh.wikisource.org/zh-hans/呐喊`
3. `https://zh.wikisource.org/zh-hans/我怎麼做起小說來？`
4. `https://www.chinawriter.com.cn/n1/2020/0331/c419384-31655463.html`
5. `https://www.chinawriter.com.cn/n1/2021/0927/c403994-32238224.html`

核对短引：

- “深蓝的天空中挂着一轮金黄的圆月。”
- “其实地上本没有路，走的人多了，也便成了路。”

### 《祝福》

1. `https://zh.wikisource.org/zh-hans/祝福`
2. `https://zh.wikisource.org/zh-hans/彷徨`
3. `https://zh.wikisource.org/zh-hans/我怎麼做起小說來？`
4. `https://www.chinawriter.com.cn/gb/n1/2021/0517/c419384-32105277.html`
5. `https://www.chinawriter.com.cn/n1/2020/0304/c419384-31616588.html`

核对短引：

- “我真傻，真的。”
- “一个人死了之后，究竟有没有魂灵的？”

### 《朝花夕拾》

1. `https://zh.wikisource.org/zh-hans/朝花夕拾`
2. `https://zh.wikisource.org/zh-hans/從百草園到三味書屋`
3. `https://zh.wikisource.org/zh-hans/阿长和山海经`
4. `https://zh.wikisource.org/zh-hans/藤野先生`
5. `https://www.chinawriter.com.cn/n1/2021/0223/c419384-32034556.html`
6. `https://www.chinawriter.com.cn/n1/2025/0520/c419382-40483409.html`

核对短引：

- “不必说碧绿的菜畦，光滑的石井栏。”
- “他是最使我感激，给我鼓励的一个。”

### 《野草》

1. `https://zh.wikisource.org/zh-hans/野草`
2. `https://zh.wikisource.org/zh-hans/秋夜_(魯迅)`
3. `https://zh.wikisource.org/zh-hans/影的告别`
4. `https://zh.wikisource.org/zh-hans/过客`
5. `https://www.chinawriter.com.cn/n1/2021/0715/c404030-32159109.html`
6. `https://www.chinawriter.com.cn/n1/2021/0903/c419384-32216582.html`

核对短引：

- “一株是枣树，还有一株也是枣树。”
- “我只得走。我还是走好罢。”

---

### Task 1: Add the Remaining-Works Content Contract

**Files:**
- Create: `tests/remaining-works-content.test.cjs`
- Read: `assets/data/works.json`
- Read: `tests/kuangren-sample.test.cjs`
- Read: `tests/works-cover-set.test.cjs`

**Interfaces:**
- Consumes: 当前六条作品 JSON 记录。
- Produces: 可按作品名称单独运行的内容验收测试；后续五个正文任务以该测试为验收标准。

- [ ] **Step 1: Create the failing content test**

Create `tests/remaining-works-content.test.cjs` with:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const worksPath = path.join(
    projectRoot,
    "assets",
    "data",
    "works.json"
);
const registryPath = path.join(
    projectRoot,
    "docs",
    "鲁迅代表作品内容资料与引用登记.md"
);

const specifications = Object.freeze({
    "aq-zhengzhuan": {
        title: "阿Q正传",
        genre: "中篇小说",
        imagePath:
            "assets/images/works/a-q-zhengzhuan-cover.webp",
        referenceCount: 5,
        requiredHeadings: [
            "作品导读",
            "创作与发表背景",
            "内容概述",
            "人物与叙述方式",
            "核心主题",
            "艺术特色",
            "文学史影响",
            "参考资料"
        ],
        requiredTerms: [
            "精神胜利法",
            "看客",
            "社会结构"
        ]
    },
    "guxiang": {
        title: "故乡",
        genre: "短篇小说",
        imagePath:
            "assets/images/works/guxiang-cover.webp",
        referenceCount: 5,
        requiredHeadings: [
            "作品导读",
            "创作与发表背景",
            "内容概述",
            "记忆与现实的双重故乡",
            "闰土与身份隔膜",
            "核心主题",
            "艺术特色",
            "文学史影响",
            "参考资料"
        ],
        requiredTerms: [
            "闰土",
            "隔膜",
            "路"
        ]
    },
    "zhufu": {
        title: "祝福",
        genre: "短篇小说",
        imagePath:
            "assets/images/works/zhufu-cover.webp",
        referenceCount: 5,
        requiredHeadings: [
            "作品导读",
            "创作与发表背景",
            "内容概述",
            "祥林嫂的命运过程",
            "礼教、族权与经济困境",
            "标题“祝福”的反讽",
            "艺术特色",
            "文学史影响",
            "参考资料"
        ],
        requiredTerms: [
            "祥林嫂",
            "礼教",
            "集体冷漠"
        ]
    },
    "zhaohua-xishi": {
        title: "朝花夕拾",
        genre: "回忆性散文集",
        imagePath:
            "assets/images/works/zhaohua-xishi-cover.webp",
        referenceCount: 6,
        requiredHeadings: [
            "作品集导读",
            "创作与结集背景",
            "整体内容与篇目构成",
            "儿童视角与成年视角",
            "三篇代表文章",
            "核心主题",
            "艺术特色",
            "文学史影响",
            "参考资料"
        ],
        requiredTerms: [
            "从百草园到三味书屋",
            "阿长与〈山海经〉",
            "藤野先生"
        ]
    },
    "yecao": {
        title: "野草",
        genre: "散文诗集",
        imagePath:
            "assets/images/works/yecao-cover.webp",
        referenceCount: 6,
        requiredHeadings: [
            "作品集导读",
            "创作与结集背景",
            "整体思想与意象体系",
            "三篇代表作品",
            "三篇作品之间的关系",
            "核心主题",
            "艺术特色",
            "文学史影响",
            "参考资料"
        ],
        requiredTerms: [
            "秋夜",
            "影的告别",
            "过客"
        ]
    }
});

function readWorks() {
    return JSON.parse(
        fs.readFileSync(worksPath, "utf8")
    );
}

function chineseCount(value) {
    return [...String(value)].filter(
        (character) => /[\u4E00-\u9FFF]/u.test(character)
    ).length;
}

function splitReferenceSection(body) {
    const marker = "\n## 参考资料\n";
    const index = body.indexOf(marker);

    assert.notEqual(
        index,
        -1,
        "正文缺少“参考资料”章节"
    );

    return {
        article: body.slice(0, index),
        references: body.slice(index + marker.length)
    };
}

function referenceDefinitions(referenceText) {
    return [
        ...referenceText.matchAll(
            /^\[(\d+)\]\s+.+https?:\/\/\S+$/gm
        )
    ].map((match) => Number(match[1]));
}

function citedReferenceNumbers(articleText) {
    return [
        ...articleText.matchAll(/\[(\d+)\]/g)
    ].map((match) => Number(match[1]));
}

function quoteCount(body) {
    return (
        body.match(/^>\s+(?!——)/gm) ?? []
    ).length;
}

function assertContentRecord(item, specification) {
    assert.ok(item, `${specification.title} 不存在`);
    assert.equal(item.content_type, "works");
    assert.equal(item.title, specification.title);
    assert.equal(
        item.metadata.genre,
        specification.genre
    );

    const count = chineseCount(item.body);
    assert.ok(
        count >= 1400,
        `${item.title} 中文字符过少：${count}`
    );
    assert.ok(
        count <= 1800,
        `${item.title} 中文字符过多：${count}`
    );

    assert.equal(
        quoteCount(item.body),
        2,
        `${item.title} 应恰好包含两处短引`
    );

    const headings = [
        ...item.body.matchAll(/^##\s+(.+)$/gm)
    ].map((match) => match[1]);

    for (
        const heading of
        specification.requiredHeadings
    ) {
        assert.ok(
            headings.includes(heading),
            `${item.title} 缺少章节：${heading}`
        );
    }

    assert.ok(
        headings.length >= 8 &&
        headings.length <= 12,
        `${item.title} 总标题数异常：${headings.length}`
    );

    for (
        const term of
        specification.requiredTerms
    ) {
        assert.match(
            item.body,
            new RegExp(term)
        );
    }

    const {
        article,
        references
    } = splitReferenceSection(item.body);

    const definitions =
        referenceDefinitions(references);
    assert.deepEqual(
        definitions,
        Array.from(
            {
                length:
                    specification.referenceCount
            },
            (_, index) => index + 1
        )
    );

    const citations =
        citedReferenceNumbers(article);
    const uniqueCitations =
        [...new Set(citations)].sort(
            (left, right) => left - right
        );

    assert.deepEqual(
        uniqueCitations,
        definitions,
        `${item.title} 正文编号与资料定义不一致`
    );

    assert.ok(
        Array.isArray(
            item.metadata.references
        ),
        `${item.title} 缺少 metadata.references`
    );
    assert.equal(
        item.metadata.references.length,
        specification.referenceCount
    );

    item.metadata.references.forEach(
        (reference, index) => {
            assert.equal(
                reference.id,
                index + 1
            );
            for (
                const field of [
                    "title",
                    "author",
                    "source",
                    "url",
                    "accessed_at"
                ]
            ) {
                assert.equal(
                    typeof reference[field],
                    "string"
                );
                assert.ok(
                    reference[field].trim(),
                    `${item.title} 资料 ${index + 1} 缺少 ${field}`
                );
            }
            assert.equal(
                reference.accessed_at,
                "2026-07-21"
            );
        }
    );

    assert.doesNotMatch(
        item.body,
        /<\/?[a-z][^>]*>/i,
        `${item.title} 正文不得包含原始 HTML`
    );
    assert.doesNotMatch(
        item.body,
        /\b(?:script|iframe|onclick|style)\b/i
    );

    assert.equal(
        item.image_path,
        specification.imagePath
    );
    assert.equal(
        item.metadata.image_type,
        "original"
    );
}

test("五部目标作品存在且编号唯一", () => {
    const works = readWorks();
    const targetSlugs =
        Object.keys(specifications);

    for (const slug of targetSlugs) {
        assert.equal(
            works.filter(
                (item) => item.slug === slug
            ).length,
            1,
            `${slug} 应恰好出现一次`
        );
    }
});

for (
    const [slug, specification] of
    Object.entries(specifications)
) {
    test(`${specification.title} 长文内容契约`, () => {
        const item = readWorks().find(
            (record) => record.slug === slug
        );
        assertContentRecord(
            item,
            specification
        );
    });
}

test("内容资料登记覆盖五部作品", () => {
    assert.ok(
        fs.existsSync(registryPath),
        "缺少内容资料与引用登记文档"
    );

    const registry =
        fs.readFileSync(
            registryPath,
            "utf8"
        );

    for (
        const specification of
        Object.values(specifications)
    ) {
        assert.match(
            registry,
            new RegExp(
                `## 《${specification.title}》`
            )
        );
    }

    assert.match(
        registry,
        /核对日期：2026-07-21/
    );
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run:

```bat
node --test tests\remaining-works-content.test.cjs
```

Expected: the existence test may pass, but the five content-contract tests fail because the current bodies are short, contain no two quote blocks, and have no `metadata.references`; the registry test also fails because the new document does not exist.

- [ ] **Step 3: Commit the failing contract**

```bat
git add tests/remaining-works-content.test.cjs
git commit -m "Add remaining works content contract"
git push
```

---

### Task 2: Complete 《阿Q正传》

**Files:**
- Modify: `assets/data/works.json`
- Create: `docs/鲁迅代表作品内容资料与引用登记.md`
- Test: `tests/remaining-works-content.test.cjs`

**Interfaces:**
- Consumes: Task 1 content contract and the five confirmed source URLs.
- Produces: the first complete target record and the registry document structure reused by Tasks 3–6.

- [ ] **Step 1: Open and verify the five source pages**

Confirm the original contains both approved short excerpts and that the research pages identify the work and author correctly. Do not copy a long passage into the project.

- [ ] **Step 2: Replace the 《阿Q正传》 summary**

Use:

```text
小说以阿Q在未庄的受辱、自我安慰、革命想象与最终死亡为线索，分析“精神胜利法”、看客心理和等级结构如何共同制造一个小人物的社会悲剧。
```

- [ ] **Step 3: Replace the body with the approved structure**

Use these headings in this order:

```text
## 作品导读
## 创作与发表背景
## 内容概述
## 人物与叙述方式
## 精神胜利法
## 核心主题
## 看客与示众
## 艺术特色
## 文学史影响
## 参考资料
```

Writing requirements:

- `作品导读`：说明作品不只讽刺阿Q本人，也审视使这种心理持续存在的未庄社会。
- `创作与发表背景`：说明作品在 1921—1922 年间连载，后来收入《呐喊》；把“正传”体例与无名小人物之间的反差写清楚。[1][2][4]
- `内容概述`：按“未庄受辱—身份欲望—误解革命—被捕示众”四阶段概括，不超过正文的四分之一。
- `人物与叙述方式`：分析姓名、籍贯和身份的不确定，叙述者的考据腔、反讽距离及未庄人物网络。
- 第一处引文框必须写成：

```text
> 我总算被儿子打了。[1]
> ——《阿Q正传》
```

- 引文后立即分析自我安慰如何暂时降低失败感，却让人物放弃理解现实和改变处境。
- `核心主题` 至少明确出现“精神胜利法”“等级意识”“社会结构”。
- 第二处引文框必须写成：

```text
> 这些眼睛们似乎连成一气，已经在那里咬他的灵魂。[1]
> ——《阿Q正传》
```

- `看客与示众`：分析群众只追逐刺激、阿Q又试图从观看者那里寻找认可，形成个人与群体的双重悲剧。
- `艺术特色`：写反讽、传记形式、喜剧外表与悲剧内核、叙述距离。
- `文学史影响`：说明“阿Q”和“精神胜利法”的文化影响，同时拒绝把人物简单等同于所有中国人。
- 全文引用编号 `[1]` 至 `[5]` 都必须在参考资料章节前实际出现。
- 最终中文字符数必须为 1400～1800。

- [ ] **Step 4: Add `metadata.references` without touching image fields**

Append this field inside the existing metadata object:

```json
"references": [
    {
        "id": 1,
        "title": "阿Q正传",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/阿Q正传",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 2,
        "title": "呐喊",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/呐喊",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 3,
        "title": "我怎么做起小说来？",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/我怎麼做起小說來？",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 4,
        "title": "重温鲁迅001：《阿Q正传》（上）",
        "author": "中国作家网编辑部",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2021/0907/c440988-32220110.html",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 5,
        "title": "重读《阿Q正传》：“Don”和“Q”",
        "author": "陆建德",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2026/0105/c419384-40638789.html",
        "accessed_at": "2026-07-21"
    }
]
```

The body reference section must contain the same titles and URLs in numbered `[1]`–`[5]` lines.

- [ ] **Step 5: Create the registry document**

Create `docs/鲁迅代表作品内容资料与引用登记.md` with:

```markdown
# 鲁迅代表作品内容资料与引用登记

本文件登记代表作品详情页的短引、原始文本、背景资料和研究资料。正文分析由本站原创整理，短引仅保留支撑分析所需的必要文字。

核对日期：2026-07-21

## 《阿Q正传》

- 稳定编号：`aq-zhengzhuan`
- 短引一：“我总算被儿子打了。”
- 短引一用途：分析精神胜利法的自我防御与现实遮蔽。
- 短引二：“这些眼睛们似乎连成一气，已经在那里咬他的灵魂。”
- 短引二用途：分析示众场景中的看客心理与群体冷漠。
- 原文编号：[1]
- 作品集编号：[2]
- 创作自述编号：[3]
- 文本与发表资料编号：[4]
- 研究资料编号：[5]
- 核对日期：2026-07-21
```

- [ ] **Step 6: Run only the 《阿Q正传》 test**

```bat
node --test --test-name-pattern="阿Q正传" tests\remaining-works-content.test.cjs
```

Expected: PASS.

- [ ] **Step 7: Run existing sample and cover regressions**

```bat
node --test tests\kuangren-sample.test.cjs tests\works-cover-set.test.cjs
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git commit -m "Complete AQ work detail content"
git push
```

---

### Task 3: Complete 《故乡》

**Files:**
- Modify: `assets/data/works.json`
- Modify: `docs/鲁迅代表作品内容资料与引用登记.md`
- Test: `tests/remaining-works-content.test.cjs`

**Interfaces:**
- Consumes: the registry format established in Task 2.
- Produces: complete `guxiang` content while preserving its WebP cover fields.

- [ ] **Step 1: Verify the five source pages and both excerpts**

Use the `故乡` Wikisource page as the authoritative text for both excerpts.

- [ ] **Step 2: Replace the summary**

```text
小说通过“我”返乡搬家的经历，把童年记忆与现实重逢并置，表现闰土等人物在贫困和身份秩序中的变化，并以“路”的意象追问新的生活如何可能。
```

- [ ] **Step 3: Replace the body**

Use this heading order:

```text
## 作品导读
## 创作与发表背景
## 内容概述
## 记忆与现实的双重故乡
## 闰土与身份隔膜
## 故乡人物群像
## 核心主题
## 艺术特色
## 文学史影响
## 参考资料
```

Requirements:

- 导读建立“过去—现在—未来”的分析线索。
- 背景说明作品写于 1921 年，发表于《新青年》第九卷第一号，后收入《呐喊》。[1][2]
- 内容概述只写返乡、回忆、重逢、离乡四阶段。
- 第一处引文框：

```text
> 深蓝的天空中挂着一轮金黄的圆月。[1]
> ——《故乡》
```

- 引文后分析儿童记忆、月夜瓜地和少年闰土的生命活力，不把记忆当作完全客观的历史照片。
- `闰土与身份隔膜`：写少年伙伴与成年“老爷”称呼之间的变化，并把贫困、礼法、身份意识联系起来。
- `故乡人物群像`：写杨二嫂、宏儿和水生；避免把杨二嫂写成单纯反派。
- 第二处引文框：

```text
> 其实地上本没有路，走的人多了，也便成了路。[1]
> ——《故乡》
```

- 引文后说明希望不是现成答案，而需要人的行动形成。
- 艺术特色写回忆与现实交错、人物对比、第一人称距离和“路”的开放性。
- 文学史影响说明返乡叙事、人际隔膜和希望意象。
- 使用 `[1]`–`[5]`，最终中文字符数 1400～1800。

- [ ] **Step 4: Add five structured references**

```json
"references": [
    {
        "id": 1,
        "title": "故乡",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/故鄉",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 2,
        "title": "呐喊",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/呐喊",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 3,
        "title": "我怎么做起小说来？",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/我怎麼做起小說來？",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 4,
        "title": "重读《故乡》：永远的《故乡》",
        "author": "郜元宝",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2020/0331/c419384-31655463.html",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 5,
        "title": "鲁迅文学奖得主相聚“百草园”纪念鲁迅诞辰140周年",
        "author": "冯源",
        "source": "中国作家网转载新华网",
        "url": "https://www.chinawriter.com.cn/n1/2021/0927/c403994-32238224.html",
        "accessed_at": "2026-07-21"
    }
]
```

- [ ] **Step 5: Append the registry section**

Add `## 《故乡》` with stable slug, both excerpts, uses, reference-number mapping and the same verification date.

- [ ] **Step 6: Run the focused test**

```bat
node --test --test-name-pattern="故乡" tests\remaining-works-content.test.cjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git commit -m "Complete hometown work detail content"
git push
```

---

### Task 4: Complete 《祝福》

**Files:**
- Modify: `assets/data/works.json`
- Modify: `docs/鲁迅代表作品内容资料与引用登记.md`
- Test: `tests/remaining-works-content.test.cjs`

**Interfaces:**
- Consumes: the same body and metadata conventions.
- Produces: complete `zhufu` content with exactly five sources.

- [ ] **Step 1: Verify the original and research pages**

Pay particular attention to the wording and punctuation of the “魂灵” question.

- [ ] **Step 2: Replace the summary**

```text
小说以祥林嫂不断失去家庭、劳动位置和精神安宁的过程为中心，揭示婚姻权力、礼教仪式、经济困境、看客冷漠与知识者迟疑如何共同制造悲剧。
```

- [ ] **Step 3: Replace the body**

Use:

```text
## 作品导读
## 创作与发表背景
## 内容概述
## 祥林嫂的命运过程
## 礼教、族权与经济困境
## 鲁镇人物与集体冷漠
## 标题“祝福”的反讽
## 艺术特色
## 文学史影响
## 参考资料
```

Requirements:

- 背景写 1924 年创作与发表，后收入《彷徨》。[1][2][4]
- 命运过程按初到鲁镇、被劫再嫁、丧夫丧子、重返鲁镇、捐门槛、死亡展开，但避免流水账。
- 第一处引文：

```text
> 我真傻，真的。[1]
> ——《祝福》
```

- 引文后从创伤重复和听众态度变化分析，不把它作为人物愚昧的笑料。
- 礼教部分写祭祀排斥、再嫁罪名、族权和经济脆弱。
- 鲁镇人物部分写鲁四老爷、柳妈、“我”和众人；说明普通人也可能传播既有秩序。
- 第二处引文：

```text
> 一个人死了之后，究竟有没有魂灵的？[1]
> ——《祝福》
```

- 引文后分析精神恐惧与“我”的含糊回答。
- `标题“祝福”的反讽` 必须出现“热闹的节日与孤独的死亡”“祈福仪式与现实排斥”。
- 艺术特色写倒叙、第一人称、语言反复、环境对照。
- 使用 `[1]`–`[5]`，中文字符数 1400～1800。

- [ ] **Step 4: Add five references**

```json
"references": [
    {
        "id": 1,
        "title": "祝福",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/祝福",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 2,
        "title": "彷徨",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/彷徨",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 3,
        "title": "我怎么做起小说来？",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/我怎麼做起小說來？",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 4,
        "title": "重读《祝福》：“祥林嫂之问”与“鲁迅思想”的发生",
        "author": "段从学",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/gb/n1/2021/0517/c419384-32105277.html",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 5,
        "title": "重读《祝福》：“连自己也烧在这里面”",
        "author": "郜元宝",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2020/0304/c419384-31616588.html",
        "accessed_at": "2026-07-21"
    }
]
```

- [ ] **Step 5: Append the registry section and run the focused test**

```bat
node --test --test-name-pattern="祝福" tests\remaining-works-content.test.cjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git commit -m "Complete blessing work detail content"
git push
```

---

### Task 5: Complete 《朝花夕拾》

**Files:**
- Modify: `assets/data/works.json`
- Modify: `docs/鲁迅代表作品内容资料与引用登记.md`
- Test: `tests/remaining-works-content.test.cjs`

**Interfaces:**
- Consumes: six verified sources and the approved three-essay scope.
- Produces: complete collection-level page without creating separate detail pages for the three essays.

- [ ] **Step 1: Verify the collection and three essay pages**

Confirm that the collection contains ten principal essays and that both excerpts appear in the corresponding essay pages.

- [ ] **Step 2: Replace the summary**

```text
这部回忆性散文集以成年视角重新整理童年、求学与师友记忆；页面通过《从百草园到三味书屋》《阿长与〈山海经〉》《藤野先生》观察温情、成长与社会反思如何并存。
```

- [ ] **Step 3: Replace the body**

Use:

```text
## 作品集导读
## 创作与结集背景
## 整体内容与篇目构成
## 儿童视角与成年视角
## 三篇代表文章
## 核心主题
## 艺术特色
## 文学史影响
## 参考资料
```

Inside `三篇代表文章`, use bold-free plain subparagraph openings:

```text
《从百草园到三味书屋》
《阿长与〈山海经〉》
《藤野先生》
```

Requirements:

- 导读解释“朝花夕拾”作为重新拾取旧日经验的命名含义。
- 背景说明 1926 年写作、最初以“旧事重提”发表、1927 年编订并改名、1928 年结集出版。[1][5][6]
- 内容构成分为故乡童年、家庭人物、私塾教育、求学与师友四类。
- 儿童视角写好奇、误解和感官经验；成年视角写重新判断和社会反思。
- 第一处引文：

```text
> 不必说碧绿的菜畦，光滑的石井栏。[2]
> ——《从百草园到三味书屋》
```

- 引文后分析感官、节奏和儿童空间，不把百草园与三味书屋简化成绝对快乐与绝对痛苦。
- 阿长部分写认识从不满、惊讶到感激和怀念的变化，突出普通劳动女性的行动。
- 藤野部分写修改讲义、平等对待和异国求学处境。
- 第二处引文：

```text
> 他是最使我感激，给我鼓励的一个。[4]
> ——《藤野先生》
```

- 引文后分析情感如何通过细节积累，不写成空泛赞美。
- 核心主题必须覆盖成长记忆、普通人物、教育环境和温情中的批判。
- 使用 `[1]`–`[6]`，中文字符数 1400～1800。

- [ ] **Step 4: Add six references**

```json
"references": [
    {
        "id": 1,
        "title": "朝花夕拾",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/朝花夕拾",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 2,
        "title": "从百草园到三味书屋",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/從百草園到三味書屋",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 3,
        "title": "阿长与《山海经》",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/阿长和山海经",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 4,
        "title": "藤野先生",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/藤野先生",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 5,
        "title": "重读《朝花夕拾》：教育成长主题和典型化",
        "author": "黄乔生",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2021/0223/c419384-32034556.html",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 6,
        "title": "《朝花夕拾》手稿略说",
        "author": "黄乔生",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2025/0520/c419382-40483409.html",
        "accessed_at": "2026-07-21"
    }
]
```

- [ ] **Step 5: Append the registry section and run the focused test**

```bat
node --test --test-name-pattern="朝花夕拾" tests\remaining-works-content.test.cjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git commit -m "Complete morning flowers work detail content"
git push
```

---

### Task 6: Complete 《野草》

**Files:**
- Modify: `assets/data/works.json`
- Modify: `docs/鲁迅代表作品内容资料与引用登记.md`
- Test: `tests/remaining-works-content.test.cjs`

**Interfaces:**
- Consumes: collection page, three representative texts and two research articles.
- Produces: the fifth complete record and a registry covering all five works.

- [ ] **Step 1: Verify all six sources**

Confirm that `秋夜`, `影的告别` and `过客` are listed in the collection and that both short excerpts match the original wording.

- [ ] **Step 2: Replace the summary**

```text
散文诗集以黑夜、枣树、影子、荒路和行走等意象呈现现代个体的精神冲突；页面通过《秋夜》《影的告别》《过客》分析绝望、独立与持续行动之间的张力。
```

- [ ] **Step 3: Replace the body**

Use:

```text
## 作品集导读
## 创作与结集背景
## 整体思想与意象体系
## 三篇代表作品
## 三篇作品之间的关系
## 核心主题
## 艺术特色
## 文学史影响
## 参考资料
```

Inside `三篇代表作品`, cover all three names explicitly.

Requirements:

- 导读说明散文诗、象征、梦境、独白与对话。
- 背景说明作品主要写于 1924—1926 年，后来结集为《野草》。[1][5][6]
- 意象体系写黑夜与寒冷、枣树与微小生命、影子与分裂自我、道路与未知前方。
- 第一处引文：

```text
> 一株是枣树，还有一株也是枣树。[2]
> ——《秋夜》
```

- 引文后分析重复句式、停顿、普通景物的精神姿态。
- `影的告别` 保留多义性，写依附与独立、存在与消失，不规定唯一政治寓意。[3]
- `过客` 写老翁、女孩与过客三种姿态，强调行动不等于已有成功保证。
- 第二处引文：

```text
> 我只得走。我还是走好罢。[4]
> ——《过客》
```

- 引文后说明“前方”没有确定答案，但停留也不能解决问题。
- 横向比较必须形成“外部黑暗—内部冲突—精神行动”。
- 核心主题写孤独中的清醒、绝望与反抗、自我分裂、没有答案的持续行动。
- 艺术特色写散文与诗性节奏、象征意象、戏剧性对话、意义开放。
- 使用 `[1]`–`[6]`，中文字符数 1400～1800。

- [ ] **Step 4: Add six references**

```json
"references": [
    {
        "id": 1,
        "title": "野草",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/野草",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 2,
        "title": "秋夜",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/秋夜_(魯迅)",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 3,
        "title": "影的告别",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/影的告别",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 4,
        "title": "过客",
        "author": "鲁迅",
        "source": "维基文库",
        "url": "https://zh.wikisource.org/zh-hans/过客",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 5,
        "title": "鲁迅散文集《野草》：绝望之境的永恒反抗",
        "author": "陈涛",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2021/0715/c404030-32159109.html",
        "accessed_at": "2026-07-21"
    },
    {
        "id": 6,
        "title": "重读《野草》：以诗为文的文体艺术特征",
        "author": "张洁宇",
        "source": "中国作家网",
        "url": "https://www.chinawriter.com.cn/n1/2021/0903/c419384-32216582.html",
        "accessed_at": "2026-07-21"
    }
]
```

- [ ] **Step 5: Append the final registry section**

The document must now contain exactly five `## 《作品名》` sections and one global verification date.

- [ ] **Step 6: Run the whole content contract**

```bat
node --test tests\remaining-works-content.test.cjs
```

Expected: all seven tests pass: one uniqueness test, five work tests and one registry test.

- [ ] **Step 7: Run all current content and cover tests**

```bat
node --test tests\kuangren-sample.test.cjs tests\works-cover-set.test.cjs tests\remaining-works-content.test.cjs
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git commit -m "Complete remaining representative works content"
git push
```

---

### Task 7: Add the Batch Migration Generator

**Files:**
- Create: `tests/generate-works-content-migration.test.cjs`
- Create: `scripts/generate-works-content-migration.cjs`
- Generate: `supabase/migrations/013_update_remaining_works_content.sql`

**Interfaces:**
- Consumes: `assets/data/works.json`.
- Produces:
  - `findTargetRecords(records): object[]`
  - `pickContentMetadata(metadata): object`
  - `createMigrationSql(records): string`
  - deterministic migration `013_update_remaining_works_content.sql`.

- [ ] **Step 1: Write the failing generator tests**

Create `tests/generate-works-content-migration.test.cjs`:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    TARGET_SLUGS,
    createMigrationSql,
    findTargetRecords,
    pickContentMetadata
} = require(
    "../scripts/generate-works-content-migration.cjs"
);

function createRecord(slug) {
    return {
        content_type: "works",
        slug,
        summary: `${slug} 摘要`,
        body: `${slug} 正文`,
        image_path:
            `assets/images/works/${slug}.webp`,
        metadata: {
            year: "2026",
            genre: "测试",
            references: [
                {
                    id: 1,
                    title: "资料"
                }
            ],
            image_type: "original",
            image_caption: "不得进入迁移"
        }
    };
}

test("只选择固定五个目标作品并保持顺序", () => {
    const records = [
        createRecord("kuangren-riji"),
        ...[...TARGET_SLUGS]
            .reverse()
            .map(createRecord)
    ];

    assert.deepEqual(
        findTargetRecords(records).map(
            (record) => record.slug
        ),
        TARGET_SLUGS
    );

    assert.throws(
        () =>
            findTargetRecords(
                records.filter(
                    (record) =>
                        record.slug !==
                        "guxiang"
                )
            ),
        /应恰好匹配 1 条/
    );
});

test("内容元数据排除所有 image_ 字段", () => {
    assert.deepEqual(
        pickContentMetadata({
            year: "1921",
            genre: "小说",
            references: [],
            image_type: "original",
            image_alt: "封面说明"
        }),
        {
            year: "1921",
            genre: "小说",
            references: []
        }
    );
});

test("迁移只更新五部正文和内容元数据", () => {
    const records =
        TARGET_SLUGS.map(createRecord);
    const sql = createMigrationSql(records);

    assert.match(sql, /^begin;/);
    assert.match(sql, /commit;\s*$/);
    assert.match(
        sql,
        /jsonb_to_recordset\(v_payload\)/
    );
    assert.match(
        sql,
        /if v_updated <> 5/
    );
    assert.match(
        sql,
        /target\.deleted_at is null/
    );

    for (const slug of TARGET_SLUGS) {
        assert.match(
            sql,
            new RegExp(`"slug": "${slug}"`)
        );
    }

    assert.doesNotMatch(
        sql,
        /kuangren-riji/
    );
    assert.doesNotMatch(
        sql,
        /image_path\s*=/
    );
    assert.doesNotMatch(
        sql,
        /image_type/
    );
    assert.doesNotMatch(
        sql,
        /sort_order\s*=/
    );
    assert.doesNotMatch(
        sql,
        /status\s*=/
    );
    assert.doesNotMatch(
        sql,
        /insert into public\.contents/
    );
});

test("相同数据重复生成完全一致", () => {
    const records =
        TARGET_SLUGS.map(createRecord);

    assert.equal(
        createMigrationSql(records),
        createMigrationSql(records)
    );
});
```

- [ ] **Step 2: Run RED**

```bat
node --test tests\generate-works-content-migration.test.cjs
```

Expected: FAIL because `scripts/generate-works-content-migration.cjs` does not exist.

- [ ] **Step 3: Implement the generator**

Create `scripts/generate-works-content-migration.cjs`:

```javascript
const fs = require("node:fs");
const path = require("node:path");

const projectRoot =
    path.resolve(__dirname, "..");

const TARGET_SLUGS = Object.freeze([
    "aq-zhengzhuan",
    "guxiang",
    "zhufu",
    "zhaohua-xishi",
    "yecao"
]);

function pickContentMetadata(metadata) {
    return Object.fromEntries(
        Object.entries(
            metadata &&
            typeof metadata === "object" &&
            !Array.isArray(metadata)
                ? metadata
                : {}
        ).filter(
            ([key]) =>
                !key.startsWith("image_")
        )
    );
}

function findTargetRecords(records) {
    return TARGET_SLUGS.map((slug) => {
        const matches = records.filter(
            (record) =>
                record.content_type ===
                    "works" &&
                record.slug === slug
        );

        if (matches.length !== 1) {
            throw new Error(
                `works:${slug} 应恰好匹配 1 条，当前为 ${matches.length} 条。`
            );
        }

        return matches[0];
    });
}

function createMigrationSql(records) {
    const targets =
        findTargetRecords(records);

    const payload = targets.map(
        (record) => ({
            content_type:
                record.content_type,
            slug: record.slug,
            summary: record.summary,
            body: record.body,
            metadata:
                pickContentMetadata(
                    record.metadata
                )
        })
    );

    const jsonText =
        JSON.stringify(payload, null, 2);
    const delimiter =
        "$content_update$";

    if (jsonText.includes(delimiter)) {
        throw new Error(
            "内容中出现 SQL 分隔符。"
        );
    }

    return `begin;

do $migration$
declare
    v_payload jsonb :=
        ($content_update$
${jsonText}
$content_update$)::jsonb;

    v_updated integer;
begin
    update public.contents as target
    set
        summary = source.summary,

        body = source.body,

        metadata =
            coalesce(
                target.metadata,
                '{}'::jsonb
            )
            ||
            coalesce(
                source.metadata,
                '{}'::jsonb
            ),

        updated_at = now()

    from jsonb_to_recordset(
        v_payload
    ) as source(
        content_type text,
        slug text,
        summary text,
        body text,
        metadata jsonb
    )

    where target.content_type =
            source.content_type
      and target.slug = source.slug
      and target.deleted_at is null;

    get diagnostics
        v_updated = row_count;

    if v_updated <> 5 then
        raise exception
            'Expected exactly five active content rows, updated %',
            v_updated;
    end if;
end
$migration$;

commit;
`;
}

function main() {
    const dataPath = path.join(
        projectRoot,
        "assets",
        "data",
        "works.json"
    );

    const records = JSON.parse(
        fs.readFileSync(
            dataPath,
            "utf8"
        )
    );

    const outputPath = path.join(
        projectRoot,
        "supabase",
        "migrations",
        "013_update_remaining_works_content.sql"
    );

    fs.mkdirSync(
        path.dirname(outputPath),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        outputPath,
        createMigrationSql(records),
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
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = {
    TARGET_SLUGS,
    createMigrationSql,
    findTargetRecords,
    pickContentMetadata
};
```

- [ ] **Step 4: Run GREEN**

```bat
node --test tests\generate-works-content-migration.test.cjs
```

Expected: four tests pass.

- [ ] **Step 5: Generate migration 013**

```bat
node scripts\generate-works-content-migration.cjs
```

Expected:

```text
已生成：F:\WebProjects\hengmei-luxun\supabase\migrations\013_update_remaining_works_content.sql
```

- [ ] **Step 6: Run the generator test again after file generation**

```bat
node --test tests\generate-works-content-migration.test.cjs
```

Expected: four tests pass.

- [ ] **Step 7: Commit**

```bat
git add scripts/generate-works-content-migration.cjs
git add tests/generate-works-content-migration.test.cjs
git add supabase/migrations/013_update_remaining_works_content.sql
git commit -m "Add remaining works content migration"
git push
```

---

### Task 8: Regenerate the Full Seed and Run Local Verification

**Files:**
- Modify/generated: `supabase/migrations/003_seed_initial_contents.sql`
- Read/test: all content, migration and project audit files.

**Interfaces:**
- Consumes: final `works.json` and migration generator.
- Produces: a future-deployment seed consistent with the current local source.

- [ ] **Step 1: Regenerate the seed**

```bat
node scripts\generate-seed-sql.cjs
```

Expected:

```text
已生成：supabase/migrations/003_seed_initial_contents.sql
```

- [ ] **Step 2: Run the complete automated test set**

```bat
node --test tests\detail-body-parser.test.mjs tests\kuangren-sample.test.cjs tests\generate-single-content-migration.test.cjs tests\detail-responsive-layout.test.cjs tests\works-cover-set.test.cjs tests\remaining-works-content.test.cjs tests\generate-works-content-migration.test.cjs
```

Expected: every test passes and `fail 0`.

- [ ] **Step 3: Run project audit**

```bat
node scripts\project-audit.cjs
```

Expected:

```text
自动验收通过：0 个错误，0 个警告
```

Migration count should now be 13.

- [ ] **Step 4: Confirm only intended files changed**

```bat
git status --short
```

Expected tracked changes include `003_seed_initial_contents.sql`; there must be no changes to `detail.html`, `detail.js`, parser, CSS or image files.

- [ ] **Step 5: Commit the regenerated seed**

```bat
git add supabase/migrations/003_seed_initial_contents.sql
git commit -m "Refresh seed for remaining works content"
git push
```

Do not execute `003_seed_initial_contents.sql` in the current Supabase project.

---

### Task 9: Apply Migration 013 to Supabase

**Files:**
- Execute only: `supabase/migrations/013_update_remaining_works_content.sql`
- Do not execute: `supabase/migrations/003_seed_initial_contents.sql`

**Interfaces:**
- Consumes: the generated, locally tested migration.
- Produces: five updated active rows in `public.contents`.

- [ ] **Step 1: Record the pre-migration state in Supabase SQL Editor**

Run:

```sql
select
    slug,
    char_length(body) as body_length,
    coalesce(
        jsonb_array_length(
            metadata -> 'references'
        ),
        0
    ) as reference_count,
    image_path,
    updated_at
from public.contents
where content_type = 'works'
  and slug in (
      'aq-zhengzhuan',
      'guxiang',
      'zhufu',
      'zhaohua-xishi',
      'yecao'
  )
order by sort_order;
```

Expected: five rows; old body lengths are short and reference counts may be zero.

- [ ] **Step 2: Execute migration 013**

Open the local file, copy its complete contents into a new Supabase SQL Editor query, and run it once.

Expected: success with no returned rows; transaction commits only if exactly five active rows are updated.

- [ ] **Step 3: Verify the post-migration state**

Run:

```sql
select
    title,
    slug,
    char_length(body) as body_length,
    jsonb_array_length(
        metadata -> 'references'
    ) as reference_count,
    image_path,
    metadata ->> 'image_type'
        as image_type,
    updated_at
from public.contents
where content_type = 'works'
  and slug in (
      'aq-zhengzhuan',
      'guxiang',
      'zhufu',
      'zhaohua-xishi',
      'yecao'
  )
order by sort_order;
```

Expected:

- five rows;
- reference counts `5, 5, 5, 6, 6`;
- every image path still ends in the existing `-cover.webp`;
- every `image_type` remains `original`;
- all five `updated_at` values are newer than the pre-migration values.

- [ ] **Step 4: Stop on any mismatch**

If fewer than five rows appear, a reference count differs, or an image path changes, do not manually patch individual rows. Correct `works.json` or the generator, regenerate 013, rerun all tests, then execute the corrected migration.

---

### Task 10: Verify All Five Detail Pages and Finish

**Files:**
- No planned production-code changes.
- Verify: local site and deployed Vercel site.

**Interfaces:**
- Consumes: Supabase rows and local fallback JSON.
- Produces: final human acceptance evidence.

- [ ] **Step 1: Open all five local detail URLs**

```text
http://127.0.0.1:5500/detail.html?type=works&id=aq-zhengzhuan
http://127.0.0.1:5500/detail.html?type=works&id=guxiang
http://127.0.0.1:5500/detail.html?type=works&id=zhufu
http://127.0.0.1:5500/detail.html?type=works&id=zhaohua-xishi
http://127.0.0.1:5500/detail.html?type=works&id=yecao
```

For each page confirm:

- cloud content is shown;
- correct WebP cover is shown;
- headings are in the approved order;
- exactly two quote boxes appear;
- every `[n]` jumps to the matching reference;
- every “返回正文” link returns;
- long Chinese titles and URLs wrap without horizontal overflow;
- no raw `##`, `>`, or reference URLs leak into article paragraphs.

- [ ] **Step 2: Check mobile layout**

Use Chrome Device Mode at `375 × 812` on at least:

- 《阿Q正传》 as a novel page;
- 《朝花夕拾》 as a collection page;
- 《野草》 as an image- and title-dense collection page.

Confirm single-column layout and no horizontal scrollbar.

- [ ] **Step 3: Check favorites**

While logged in, on one novel and one collection:

1. favorite;
2. refresh and confirm state remains;
3. unfavorite;
4. refresh and confirm removal.

- [ ] **Step 4: Verify local fallback data**

Temporarily disable network in DevTools, refresh one target page, and confirm the page still renders from `works.json`. Re-enable network afterward.

- [ ] **Step 5: Run fresh final automation**

```bat
node --test tests\detail-body-parser.test.mjs tests\kuangren-sample.test.cjs tests\generate-single-content-migration.test.cjs tests\detail-responsive-layout.test.cjs tests\works-cover-set.test.cjs tests\remaining-works-content.test.cjs tests\generate-works-content-migration.test.cjs

node scripts\project-audit.cjs
```

Expected: `fail 0`, then `0 个错误，0 个警告`.

- [ ] **Step 6: Confirm Git state**

```bat
git status
git log -1 --oneline
```

Expected:

```text
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

If any intended files remain uncommitted:

```bat
git add assets/data/works.json
git add "docs/鲁迅代表作品内容资料与引用登记.md"
git add scripts/generate-works-content-migration.cjs
git add tests/remaining-works-content.test.cjs
git add tests/generate-works-content-migration.test.cjs
git add supabase/migrations/003_seed_initial_contents.sql
git add supabase/migrations/013_update_remaining_works_content.sql

git commit -m "Complete remaining representative works"
git push
```

- [ ] **Step 7: Verify deployed pages**

After Vercel finishes deploying, open the five production URLs under:

```text
https://hengmei-luxun.vercel.app/detail.html?type=works&id=<slug>
```

Confirm each page matches local behavior and receives the updated Supabase content.

---

## Plan Self-Review Results

- **Spec coverage:** all five content designs, reference registration, content tests, batch migration, seed regeneration, Supabase execution, responsive checks, citation jumps, favorites and fallback behavior have explicit tasks.
- **Resolved ambiguity:** total `##` heading count is tested as 8–12 because the approved per-work structures contain fixed framing sections plus 4–6 main analysis units.
- **Safety boundary:** the batch migration excludes `image_path` and all `image_*` metadata, does not update status or sorting, and aborts unless exactly five active rows update.
- **Scope boundary:** no new HTML page and no common detail-parser/CSS change are included.
- **Placeholder scan:** no `TBD`, `TODO`, “similar to”, or unspecified test step remains.
