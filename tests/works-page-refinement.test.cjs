const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "works.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "css", "works.css"), "utf8");
const listScript = fs.readFileSync(path.join(root, "assets", "js", "content-list.js"), "utf8");

test("representative works page presents six chronological collection entries", () => {
    assert.match(html, /class="works-page"/);
    assert.match(html, /assets\/css\/works\.css/);
    assert.equal((html.match(/href="#work-/g) ?? []).length, 6);
    assert.match(html, /class="works-hero-cover"/);
});

test("works cards render complete local covers and stable anchors", () => {
    assert.match(listScript, /function createWorkCover\(item\)/);
    assert.match(listScript, /card\.id = `work-\$\{item\.slug\}`/);
    assert.match(listScript, /card\.append\(createWorkCover\(item\)\)/);
    assert.match(listScript, /function sortWorksChronologically\(records\)/);
    assert.match(listScript, /contentType === "works"[\s\S]*?sortWorksChronologically\(result\.data\)/);
    assert.match(css, /\.work-card-cover img\s*\{[\s\S]*?object-fit:\s*contain/);
});

test("works collection uses two desktop reading-room columns and one narrow column", () => {
    assert.match(css, /\.works-page \.content-grid\s*\{[\s\S]*?repeat\(2,/);
    assert.match(css, /@media \(max-width:\s*1180px\)[\s\S]*?\.works-page \.content-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    assert.match(css, /@media \(max-width:\s*560px\)[\s\S]*?\.content-card--work\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
});
