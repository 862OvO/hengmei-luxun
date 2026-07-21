const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const worksPath = path.join(projectRoot, "assets", "data", "works.json");

function readWorks() {
    return JSON.parse(fs.readFileSync(worksPath, "utf8"));
}

test("作品馆藏仍保持六条且编号唯一", () => {
    const works = readWorks();
    assert.equal(works.length, 6);
    assert.equal(new Set(works.map((item) => item.slug)).size, 6);
});

test("狂人日记样板满足正文结构要求", () => {
    const item = readWorks().find((record) => record.slug === "kuangren-riji");
    assert.ok(item);

    const chineseCount = [...item.body].filter((character) =>
        /[一-鿿]/u.test(character)
    ).length;

    assert.ok(chineseCount >= 1400, `中文字符过少：${chineseCount}`);
    assert.ok(chineseCount <= 1800, `中文字符过多：${chineseCount}`);

    const headings = [...item.body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
    assert.deepEqual(headings, [
        "作品导读",
        "创作与发表背景",
        "内容概述",
        "主要人物与叙述视角",
        "核心主题",
        "艺术特色",
        "文学史影响",
        "参考资料"
    ]);

    const quoteCount = (item.body.match(/^>\s+(?!——)/gm) ?? []).length;
    assert.equal(quoteCount, 2);

    const referenceCount = (item.body.match(/^\[\d+\]\s+/gm) ?? []).length;
    assert.equal(referenceCount, 5);

    for (const number of ["1", "2", "3", "4", "5"]) {
        assert.match(item.body, new RegExp(`\[${number}\]`));
    }
});

test("狂人日记封面和授权元数据完整", () => {
    const item = readWorks().find((record) => record.slug === "kuangren-riji");
    const imagePath = path.join(projectRoot, ...item.image_path.split("/"));
    assert.ok(fs.existsSync(imagePath));
    assert.equal(item.metadata.image_type, "original");

    [
        "image_caption",
        "image_creator",
        "image_date",
        "image_source",
        "image_license",
        "image_alt"
    ].forEach((field) => {
        assert.equal(typeof item.metadata[field], "string");
        assert.ok(item.metadata[field].trim());
    });
});
