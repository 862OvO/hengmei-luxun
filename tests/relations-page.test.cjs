const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "relations.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/relations.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/relations.js"), "utf8");

test("人物关系页加载专属样式、脚本和语义化区域", () => {
    assert.match(html, /assets\/css\/relations\.css/);
    assert.match(html, /assets\/js\/relations\.js/);
    assert.match(html, /id="relationship-map"/);
    assert.match(html, /data-people-grid/);
    assert.match(html, /id="interaction-timeline"/);
    assert.match(html, /id="relations-references"/);
    assert.doesNotMatch(html, /即将建立|后续将|敬请期待/);
});

test("筛选器可访问且三个内容区域由同一状态联动", () => {
    assert.equal((html.match(/data-filter=/g) || []).length, 4);
    assert.match(html, /aria-pressed="true"/);
    assert.match(js, /renderMap\(visible\)/);
    assert.match(js, /renderPeople\(visible\)/);
    assert.match(js, /renderTimeline\(visible\)/);
    assert.match(js, /scrollIntoView/);
});

test("关系页为平板和手机提供响应式布局", () => {
    assert.match(css, /@media \(max-width: 900px\)/);
    assert.match(css, /@media \(max-width: 620px\)/);
    assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
    assert.match(css, /prefers-reduced-motion/);
});

