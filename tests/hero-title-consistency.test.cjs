const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("首页首行标题在各断点保持单行并使用独立字号", () => {
    const html = read("index.html");
    const css = read("assets/css/home.css");
    assert.match(html, /class="home-title-line">在文字与时代之间，/);
    assert.match(html, /class="home-title-subject">重新走近鲁迅/);
    assert.match(css, /\.home-title-line[^}]*white-space:\s*nowrap/s);
    assert.match(css, /\.home-hero-grid[^}]*1480px/s);
    assert.match(css, /\.home-hero h1\s*\{[^}]*flex-direction:\s*column[^}]*gap:\s*4px[^}]*white-space:\s*nowrap/s);
});

test("人物关系标题只强调主题行", () => {
    const css = read("assets/css/relations.css");
    assert.match(css, /\.hero-title-prefix\s*\{[^}]*color:\s*#f9f3e9/s);
    assert.match(css, /\.hero-title-subject\s*\{[^}]*color:\s*#cf8d89/s);
});

test("八个主要展馆首屏标题统一为七百字重", () => {
    const rules = [
        ["assets/css/home.css", /\.home-hero h1\s*\{[^}]*font-weight:\s*700/s],
        ["assets/css/biography.css", /\.biography-hero \.hero-title\s*\{[^}]*font-weight:\s*700/s],
        ["assets/css/works.css", /\.works-hero \.hero-title\s*\{[^}]*font-weight:\s*700/s],
        ["assets/css/relations.css", /\.relations-hero \.hero-title\s*\{[^}]*font-weight:\s*700/s],
        ["assets/css/quotes.css", /\.quotes-hero \.hero-title strong\{[^}]*font-weight:700/s],
        ["assets/css/history.css", /\.history-hero \.hero-title\{[^}]*font-weight:700/s],
        ["assets/css/articles.css", /\.articles-hero \.hero-title \{[^}]*font-weight: 700/s],
        ["assets/css/gallery.css", /\.gallery-hero \.hero-title \{[^}]*font-weight: 700/s]
    ];
    for (const [file, pattern] of rules) assert.match(read(file), pattern, file);
});
