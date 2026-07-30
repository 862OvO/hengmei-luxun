const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "favorites.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/favorites.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/favorites-page.js"), "utf8");

test("我的收藏采用私人藏品柜视觉和分类概览", () => {
    assert.match(html, /class="favorites-page"/);
    assert.match(html, /PRIVATE COLLECTION · NO\. 11/);
    assert.match(html, /class="favorites-dossier"/);
    assert.match(html, /data-favorite-type-count="works"/);
    assert.match(css, /content:"COLLECTION"/);
});

test("三类收藏卡片都有稳定的类型标记", () => {
    assert.match(js, /favorite-card--\$\{item\.content_type\}/);
    assert.match(js, /favorite-card-image--\$\{item\.content_type\}/);
    assert.match(js, /data-favorite-type-count/);
});

test("收藏图片保持原始比例且卡片同一行等高", () => {
    assert.match(css, /\.favorites-grid \{[\s\S]*align-items:stretch/);
    assert.match(css, /\.favorite-card \{[\s\S]*height:100%/);
    assert.match(css, /\.favorite-card-image img \{[\s\S]*height:auto;[\s\S]*object-fit:contain/);
    assert.doesNotMatch(css, /\.favorite-card-image img[^}]*object-fit:cover/);
    assert.doesNotMatch(css, /\.favorite-card-image\s*\{[^}]*min-height/);
});

test("空收藏提供三类内容入口", () => {
    assert.match(js, /浏览代表作品/);
    assert.match(js, /阅读作品赏析/);
    assert.match(js, /查看历史影像/);
});

test("收藏页在平板和手机端收束为单列且减少动效", () => {
    assert.match(css, /@media\(max-width:1100px\)/);
    assert.match(css, /\.favorites-grid \{ grid-template-columns:1fr; \}/);
    assert.match(css, /@media\(max-width:460px\)/);
    assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
