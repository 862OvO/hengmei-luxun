const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "articles.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/articles.css"), "utf8");
const detailCss = fs.readFileSync(path.join(root, "assets/css/detail.css"), "utf8");

test("赏析页采用独立的批评阅读视觉语义", () => {
    assert.match(html, /class="articles-page"/);
    assert.match(html, /id="main-content"/);
    assert.match(css, /content: "CRITIQUE"/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css, /\.article-card-cover/);
});

test("赏析详情使用专属深色档案侧栏和编号章节", () => {
    assert.match(detailCss, /\.detail-article--articles \.detail-sidebar/);
    assert.match(detailCss, /#2b2420/);
    assert.match(detailCss, /counter-reset: article-section/);
    assert.match(detailCss, /counter-increment: article-section/);
});

test("赏析卡片在窄屏收紧封面轨道并保持整行正文", () => {
    assert.match(css, /@media\(max-width:600px\)/);
    assert.match(css, /\.article-card-cover\{grid-row:1\/4\}/);
    assert.match(css, /\.article-card-cover img \{ width: 100%; height:auto;/);
    assert.match(css, /\.content-card-summary[^}]*grid-column:1\/-1/);
});
