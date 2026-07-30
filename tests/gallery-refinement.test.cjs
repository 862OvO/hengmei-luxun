const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "gallery.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/gallery.css"), "utf8");
const detailCss = fs.readFileSync(path.join(root, "assets/css/detail.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/gallery.js"), "utf8");

test("历史影像首屏沿用深色文化展馆体系", () => {
    assert.match(html, /class="gallery-page"/);
    assert.match(html, /id="main-content"/);
    assert.match(css, /--gallery-dark: #15120f/);
    assert.match(css, /content: "VISUAL ARCHIVE"/);
    assert.match(css, /min-height: min\(860px, calc\(100vh - 74px\)\)/);
});

test("档案卡片按原始比例完整显示图片", () => {
    assert.match(js, /classifyImage/);
    assert.match(js, /is-portrait/);
    assert.match(js, /is-landscape/);
    assert.match(css, /\.gallery-card-media img \{ width:100%; height:auto;/);
    assert.match(css, /object-fit:contain/);
    assert.doesNotMatch(css, /\.gallery-card-media img[^}]*object-fit:cover/);
    assert.doesNotMatch(css, /\.gallery-card-media\s*\{[^}]*aspect-ratio/);
});

test("竖幅衬底和灯箱不会把图片容器强制拉长", () => {
    assert.match(css, /\.gallery-card-media\.is-portrait \{ padding:18px 21%;/);
    assert.match(css, /\.lightbox-media \{[^}]*min-height:0;[^}]*height:min\(78vh,760px\)/);
    assert.match(css, /\.lightbox-media img \{ width:auto; height:auto;/);
});

test("同一年代同一行的档案卡片保持等高且操作区底部对齐", () => {
    assert.match(css, /\.gallery-grid \{[^}]*align-items:stretch/);
    assert.match(css, /\.gallery-card \{[^}]*height:100%;[^}]*display:flex;[^}]*flex-direction:column/);
    assert.match(css, /\.gallery-card-copy \{[^}]*flex:1;[^}]*display:flex;[^}]*flex-direction:column/);
    assert.match(css, /\.gallery-card-actions \{ margin-top:auto;/);
});

test("历史影像详情使用专属深色展陈头部且窄屏仍为单列", () => {
    assert.match(detailCss, /\.detail-article--gallery \.detail-heading/);
    assert.match(detailCss, /#211b18/);
    assert.match(detailCss, /@media \(max-width: 900px\)/);
    assert.match(detailCss, /\.detail-article--articles \.detail-layout,\s*\.detail-article--gallery \.detail-layout/);
});

test("历史影像按年代分段展示并保留完整筛选结果", () => {
    assert.match(js, /function progressiveGalleryItems/);
    assert.match(js, /data-gallery-more/);
    assert.match(js, /继续查看其余/);
    assert.match(js, /viewState\.filter !== "all"/);
});
