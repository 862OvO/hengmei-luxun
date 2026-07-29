const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "relations.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/relations.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/relations.js"), "utf8");

test("人物关系页使用社会关系档案馆的展陈结构", () => {
    assert.match(html, /class="relations-page"/);
    assert.match(html, /RELATION ARCHIVE/);
    assert.equal((html.match(/class="archive-strip/g) || []).length, 3);
    assert.match(css, /--relations-dark:/);
    assert.match(css, /NETWORK ATLAS|\.relationship-map/);
});

test("人物卡片具有档案编号并在桌面展开为完整档案", () => {
    assert.match(js, /details\.dataset\.record/);
    assert.match(js, /person-index/);
    assert.match(css, /\.person-card\[open\]\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
    assert.match(css, /\.person-card-content\s*\{[^}]*grid-template-columns:/s);
});

test("交往年表使用全宽档案条目且移动端重新排版", () => {
    assert.match(js, /interaction-index/);
    assert.match(css, /\.interaction-item\s*\{[^}]*grid-template-columns:\s*58px\s+120px/s);
    assert.match(css, /@media \(max-width: 620px\)/);
    assert.match(css, /\.interaction-year\s*\{\s*grid-column:\s*2;/);
});
