const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "assets/css/common.css"), "utf8");
const authState = fs.readFileSync(path.join(root, "assets/js/auth-state.js"), "utf8");
const commonFrame = fs.readFileSync(path.join(root, "assets/js/common-frame.js"), "utf8");
const footerLinks = fs.readFileSync(path.join(root, "assets/js/footer-links.js"), "utf8");

test("standard pages load the shared interaction frame", () => {
    assert.match(authState, /import "\.\/common-frame\.js"/);
    assert.match(commonFrame, /ensureSkipLink/);
    assert.match(commonFrame, /main\.id = "main-content"/);
    assert.match(commonFrame, /aria-label/);
});

test("the responsive header uses one desktop row and two compact narrow rows", () => {
    assert.match(css, /grid-template-areas:\s*"brand nav search account"/);
    assert.match(css, /"brand search account"\s*"nav nav nav"/);
    assert.match(css, /overflow-x:\s*auto/);
    assert.match(css, /scrollbar-width:\s*none/);
    assert.match(css, /\.site-header:not\(\.auth-header\) \.header-tools\s*\{\s*display:\s*contents/);
});

test("the shared footer provides the six principal exhibition entrances", () => {
    for (const href of [
        "index.html",
        "biography.html",
        "works.html",
        "articles.html",
        "gallery.html",
        "messages.html"
    ]) {
        assert.match(footerLinks, new RegExp(href.replace(".", "\\.")));
    }

    assert.match(footerLinks, /navigation\.replaceChildren/);
    assert.match(css, /\.site-footer\s*\{[\s\S]*?#1d1a18/);
});

test("the narrow navigation exposes hidden destinations without a scrollbar", () => {
    assert.match(commonFrame, /updateNavigationOverflow/);
    assert.match(commonFrame, /can-scroll-left/);
    assert.match(commonFrame, /can-scroll-right/);
    assert.match(css, /\.can-scroll-left\.can-scroll-right[\s\S]*?mask-image/);
});

test("the public frame preserves visible keyboard focus", () => {
    assert.match(css, /:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--color-red\)/);
});
