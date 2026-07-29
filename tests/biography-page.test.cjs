const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "biography.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/biography.css"), "utf8");
const script = fs.readFileSync(path.join(root, "assets/js/biography.js"), "utf8");

test("biography keeps eighteen verified life nodes and six exhibition stages", () => {
    assert.equal((html.match(/class="timeline-item(?: timeline-item-featured)?"/g) ?? []).length, 18);
    assert.equal((html.match(/data-biography-stage="/g) ?? []).length, 6);
    assert.equal((html.match(/data-biography-stage-link="/g) ?? []).length, 6);
    assert.equal((html.match(/class="biography-era biography-era-/g) ?? []).length, 6);
    assert.equal((html.match(/data-era-place="/g) ?? []).length, 6);
    assert.equal((html.match(/data-era-years="/g) ?? []).length, 6);
});

test("biography desktop hero and era scenes use exhibition-scale layouts", () => {
    assert.match(css, /\.biography-hero \.hero-grid\s*\{[\s\S]*?1480px/);
    assert.match(css, /\.biography-hero\s*\{[\s\S]*?min-height:\s*clamp\(700px/);
    assert.match(css, /\.biography-era\s*\{[\s\S]*?box-shadow:\s*0 0 0 100vmax/);
    assert.match(css, /content:\s*attr\(data-era-place\)[\s\S]*?attr\(data-era-years\)/);
});

test("biography hero uses a complete documented portrait", () => {
    assert.match(html, /class="biography-hero-portrait"/);
    assert.match(html, /09-lu-xun-1930\.jpg/);
    assert.match(html, /href="#image-source-9"/);
    assert.match(css, /\.biography-hero-portrait img\s*\{[\s\S]*?height:\s*auto[\s\S]*?object-fit:\s*contain/);
});

test("biography timeline preserves all twelve licensed images without forced crops", () => {
    assert.equal((html.match(/class="timeline-figure/g) ?? []).length, 12);
    assert.match(css, /\.timeline-figure img,[\s\S]*?object-fit:\s*contain/);
});

test("biography enhancements provide reading progress, stage tracking and reduced motion", () => {
    assert.match(html, /assets\/js\/biography\.js/);
    assert.match(html, /class="biography-reading-progress"/);
    assert.match(script, /IntersectionObserver/);
    assert.match(script, /updateActiveStage/);
    assert.match(script, /updateProgress/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("biography narrow layout keeps horizontal stage navigation and one-column timeline", () => {
    assert.match(css, /\.biography-path ol\s*\{[\s\S]*?overflow-x:\s*auto/);
    assert.match(css, /\.timeline-item\s*\{[\s\S]*?padding-left:\s*46px/);
    assert.match(css, /@media \(max-width:\s*560px\)/);
});
