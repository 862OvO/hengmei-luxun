const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "articles.html"), "utf8");
const detailHtml = fs.readFileSync(path.join(root, "detail.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/articles.css"), "utf8");
const detailCss = fs.readFileSync(path.join(root, "assets/css/detail.css"), "utf8");
const listJs = fs.readFileSync(path.join(root, "assets/js/content-list.js"), "utf8");
const detailJs = fs.readFileSync(path.join(root, "assets/js/detail.js"), "utf8");

test("赏析总页明确区别作品档案并加载专属样式", () => {
    assert.match(html, /代表作品页回答“作品是什么”/);
    assert.match(html, /assets\/css\/articles\.css/);
    assert.match(html, /data-content-type="articles"/);
    assert.doesNotMatch(html, /即将|敬请期待|后续将/);
});

test("赏析总页提供搜索与四个体裁筛选器", () => {
    assert.match(html, /data-article-search/);
    assert.equal((html.match(/data-article-filter=/g) || []).length, 4);
    assert.match(listJs, /initializeArticleControls/);
    assert.match(listJs, /getArticleSearchText/);
    assert.match(listJs, /article-card-focus/);
});

test("赏析详情提供阅读进度、目录与关联阅读", () => {
    assert.match(detailHtml, /data-reading-progress/);
    assert.match(detailHtml, /data-detail-toc/);
    assert.match(detailHtml, /data-detail-related/);
    assert.match(detailJs, /initializeReadingProgress/);
    assert.match(detailJs, /renderArticleToc/);
    assert.match(detailJs, /renderRelatedReading/);
    assert.match(detailCss, /detail-article--articles/);
});

test("赏析列表和详情支持窄屏及减少动画偏好", () => {
    assert.match(css, /@media\(max-width:800px\)/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(detailCss, /@media \(max-width: 820px\)/);
    assert.match(detailCss, /prefers-reduced-motion/);
});
