const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
    path.join(root, "index.html"),
    "utf8"
);
const css = fs.readFileSync(
    path.join(root, "assets/css/home.css"),
    "utf8"
);
const script = fs.readFileSync(
    path.join(root, "assets/js/home.js"),
    "utf8"
);

test("首页采用六段策展叙事而非项目状态展示", () => {
    for (const id of [
        "entrance",
        "life-and-era",
        "literature",
        "spirit",
        "people-and-images",
        "echo"
    ]) {
        assert.match(html, new RegExp(`id="${id}"`));
    }

    assert.doesNotMatch(html, /project-status|项目环境配置完成/);
    assert.equal((html.match(/data-home-section/g) ?? []).length, 6);
});

test("首屏语录具有明确作品与年份出处", () => {
    assert.match(html, /愿中国青年都摆脱冷气/);
    assert.match(html, /《随感录四十一》，1919年/);
    assert.match(html, /fetchpriority="high"/);
});

test("首页史料图片声明尺寸、替代文本与延迟加载", () => {
    const imageTags = html.match(/<img[\s\S]*?>/g) ?? [];
    assert.ok(imageTags.length >= 8);

    for (const tag of imageTags) {
        assert.match(tag, /\bwidth="\d+"/);
        assert.match(tag, /\bheight="\d+"/);
        assert.match(tag, /\balt="[^"]*"/);
    }

    assert.ok(
        imageTags.slice(2).every(
            (tag) => /loading="lazy"/.test(tag)
        )
    );
});

test("首页接入专属样式、脚本、全站搜索与页脚入口", () => {
    assert.match(html, /assets\/css\/home\.css/);
    assert.match(html, /assets\/js\/home\.js/);
    assert.match(html, /assets\/js\/header-search\.js/);
    assert.match(html, /assets\/js\/footer-links\.js/);
});

test("首页动效支持渐进增强与减少动画偏好", () => {
    assert.match(css, /\.home-enhanced \[data-reveal\]/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(script, /IntersectionObserver/);
    assert.match(script, /prefers-reduced-motion: reduce/);
});

test("今日回响只读取公开审核留言并保留稳定回退", () => {
    assert.match(script, /loadPublicMessages/);
    assert.match(script, /loadPublicMessages\(\s*1,\s*3\s*\)/);
    assert.match(script, /留言暂不可用/);
    assert.match(script, /textContent/);
    assert.doesNotMatch(script, /innerHTML/);
});

test("literature cards show complete covers instead of narrow crops", () => {
    assert.match(css, /\.work-panel\s*\{[\s\S]*?grid-template-rows:\s*auto 1fr/);
    assert.match(css, /\.work-panel figure img\s*\{[\s\S]*?object-fit:\s*contain/);
    assert.doesNotMatch(css, /grid-template-columns:\s*112px minmax\(0, 1fr\)/);
});
