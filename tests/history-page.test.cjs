const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "history.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/history.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/history.js"), "utf8");

test("时代背景页加载完整模块且移除占位文案", () => {
    assert.match(html, /assets\/css\/history\.css/); assert.match(html, /assets\/js\/history\.js/);
    for (const id of ["history-timeline", "history-themes", "works-context", "history-references"]) assert.match(html, new RegExp(`id="${id}"`));
    assert.doesNotMatch(html, /即将|后续将|敬请期待/);
});

test("五个筛选按钮联动时间线并具备可访问状态", () => {
    assert.equal((html.match(/data-history-filter=/g) || []).length, 5);
    assert.match(html, /aria-pressed="true"/); assert.match(js, /renderTimeline\(events\)/); assert.match(js, /setAttribute\("aria-pressed"/);
});

test("页面提供手机布局与减少动画偏好", () => {
    assert.match(css, /@media \(max-width: 680px\)/); assert.match(css, /grid-template-columns: 1fr/); assert.match(css, /prefers-reduced-motion/);
});

