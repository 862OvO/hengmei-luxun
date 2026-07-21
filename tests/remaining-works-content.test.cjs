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
