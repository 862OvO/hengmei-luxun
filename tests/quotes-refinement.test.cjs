const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "quotes.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/quotes.css"), "utf8");

test("经典语录页采用思想摘录馆展陈结构", () => {
    assert.match(html, /class="quotes-page"/);
    assert.match(html, /VERIFIED EXCERPTS/);
    assert.match(html, /featured-figure-index/);
    assert.match(css, /--quote-dark:/);
    assert.match(css, /EXCERPT READING ROOM/);
});

test("语录馆桌面三列并逐级收束为移动端单列", () => {
    assert.match(css, /\.quote-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s);
    assert.match(css, /@media\(max-width:1100px\)[\s\S]*\.quote-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
    assert.match(css, /@media\(max-width:600px\)[\s\S]*\.quote-grid\{grid-template-columns:1fr\}/);
});

test("精选语录展示完整肖像并避免移动端标题孤字", () => {
    assert.match(css, /\.featured-quote img\{[^}]*height:auto[^}]*object-fit:contain/s);
    assert.match(css, /@media\(max-width:600px\)[\s\S]*\.featured-quote h2\{[^}]*white-space:nowrap/);
});
