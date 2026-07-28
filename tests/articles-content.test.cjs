const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const articles = JSON.parse(fs.readFileSync(path.join(root, "assets/data/articles.json"), "utf8"));
const works = JSON.parse(fs.readFileSync(path.join(root, "assets/data/works.json"), "utf8"));

test("作品赏析包含六篇唯一长文和约定体裁", () => {
    assert.equal(articles.length, 6);
    assert.equal(new Set(articles.map((item) => item.slug)).size, 6);
    const genres = articles.reduce((all, item) => ({ ...all, [item.metadata.genre_group]: (all[item.metadata.genre_group] || 0) + 1 }), {});
    assert.deepEqual(genres, { 小说: 4, 散文: 1, 散文诗: 1 });
});

test("每篇赏析达到深度导读篇幅并具有完整结构", () => {
    articles.forEach((item) => {
        assert.ok(item.body.length >= 1900, `${item.slug} 正文不足 1900 字符`);
        assert.ok((item.body.match(/^## /gm) || []).length >= 7, `${item.slug} 章节不足`);
        assert.match(item.body, /## 阅读入口/);
        assert.match(item.body, /## 参考资料/);
        const referenceLines = item.body
            .split("\n")
            .filter((line) => /^\[\d+\].*https:\/\//.test(line));
        assert.ok(referenceLines.length >= 4, `${item.slug} 资料不足`);
        assert.ok(item.metadata.key_questions.length === 3);
        assert.match(item.metadata.reading_time, /^约\d+分钟$/);
    });
});

test("赏析与代表作品建立关联但正文不重复", () => {
    articles.forEach((article) => {
        const work = works.find((item) => item.slug === article.metadata.related_work_slug);
        assert.ok(work, `${article.slug} 缺少对应作品`);
        assert.notEqual(article.body, work.body);
        assert.notEqual(article.summary, work.summary);
        assert.equal(article.image_path, work.image_path);
        assert.ok(fs.existsSync(path.join(root, article.image_path)));
        assert.ok(article.metadata.related_links.some((item) => item.url.includes(`type=works&id=${work.slug}`)));
    });
});

test("研究来源和关联阅读均使用安全链接", () => {
    articles.forEach((article) => {
        const urls = [...article.body.matchAll(/https:\/\/[^\s]+/g)].map((match) => match[0]);
        assert.ok(urls.length >= 4);
        article.metadata.related_links.forEach((item) => assert.doesNotMatch(item.url, /^http:/));
    });
});
