const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "history.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/history.css"), "utf8");

test("时代背景页采用历史长卷展陈结构", () => {
    assert.match(html, /class="history-page"/);
    assert.match(html, /id="main-content"/);
    assert.match(css, /HISTORICAL ARCHIVE/);
    assert.match(css, /ARCHIVE INDEX/);
    assert.match(css, /--history-dark:/);
});

test("十八个节点在桌面使用全宽编年档案流", () => {
    assert.match(css, /\.history-timeline\{[^}]*max-width:none/s);
    assert.match(css, /\.history-event\{[^}]*grid-template-columns:210px minmax\(0,1fr\)/s);
    assert.match(css, /\.history-event-heading\{[^}]*grid-template-columns:minmax\(210px,.45fr\) minmax\(0,1.55fr\)/s);
});

test("专题史料图完整展示且移动端恢复单列阅读", () => {
    assert.match(css, /\.theme-figure img\{[^}]*height:auto[^}]*object-fit:contain/s);
    assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.history-event\{grid-template-columns:1fr/);
    assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.theme-card\{grid-template-columns:1fr/);
});

test("六部作品坐标使用独立深色年代索引", () => {
    assert.match(css, /\.works-context\{[^}]*background:linear-gradient/s);
    assert.match(css, /\.works-context-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s);
    assert.match(css, /WORKS COORDINATES/);
});
