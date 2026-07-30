const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "admin.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/admin.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/admin-page.js"), "utf8");

test("管理后台采用编辑部工作台视觉", () => {
    assert.match(html, /class="admin-page"/);
    assert.match(html, /EDITORIAL DESK · NO\. 12/);
    assert.match(html, /class="admin-identity"/);
    assert.match(css, /content:"EDITORIAL"/);
    assert.match(css, /grid-template-columns:230px minmax\(0,1fr\)/);
});

test("五个工作模块具有完整标签页语义", () => {
    for (const panel of ["contents", "editor", "trash", "messages", "users"]) {
        assert.match(html, new RegExp(`id="admin-tab-${panel}"`));
        assert.match(html, new RegExp(`aria-controls="admin-panel-${panel}"`));
        assert.match(html, new RegExp(`id="admin-panel-${panel}"`));
        assert.match(html, new RegExp(`aria-labelledby="admin-tab-${panel}"`));
    }
    assert.match(js, /button\.tabIndex =/);
    assert.match(js, /ArrowUp/);
    assert.match(js, /ArrowRight/);
});

test("编辑图片完整显示且表单保存区保持可见", () => {
    assert.match(css, /\.admin-image-preview img \{[^}]*height:auto;[^}]*object-fit:contain/);
    assert.doesNotMatch(css, /\.admin-image-preview img[^}]*object-fit:cover/);
    assert.match(css, /\.admin-form-actions \{[^}]*position:sticky/);
});

test("危险操作具有独立的警示样式", () => {
    assert.match(css, /\.admin-action-button\.danger/);
    assert.match(css, /\.admin-action-button\.warning/);
    assert.match(js, /永久删除/);
    assert.match(js, /进行第二次确认/);
});

test("窄屏工作台使用横向标签和单列内容", () => {
    assert.match(css, /@media\(max-width:1080px\)/);
    assert.match(css, /\.admin-tabs \{[^}]*overflow-x:auto;[^}]*flex-direction:row/);
    assert.match(css, /@media\(max-width:720px\)/);
    assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
    assert.match(js, /aria-orientation/);
});
