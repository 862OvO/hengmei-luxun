const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "profile.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/profile.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets/js/profile.js"), "utf8");

test("个人中心采用独立但统一的会员档案视觉", () => {
    assert.match(html, /assets\/css\/profile\.css/);
    assert.match(html, /class="profile-identity"/);
    assert.match(html, /class="profile-shortcuts"/);
    assert.match(css, /--profile-dark: #1a1512/);
    assert.match(css, /content:"MEMBER"/);
});

test("个人中心展示身份状态与活动摘要", () => {
    assert.match(html, /id="profile-role"/);
    assert.match(html, /id="profile-account-status"/);
    assert.match(html, /id="profile-favorite-count"/);
    assert.match(html, /id="profile-message-count"/);
    assert.match(js, /nickname, role, account_status, created_at, updated_at/);
    assert.match(js, /\.from\("favorites"\)[\s\S]*count: "exact"/);
    assert.match(js, /\.from\("messages"\)[\s\S]*count: "exact"/);
});

test("管理入口只向管理员显示", () => {
    assert.match(html, /id="profile-admin-link" hidden/);
    assert.match(js, /const isAdmin = profile\.role === "admin"/);
    assert.match(js, /profileAdminLink\.hidden = !isAdmin/);
});

test("窄屏切为单列并尊重减少动态效果偏好", () => {
    assert.match(css, /@media\(max-width:1000px\)/);
    assert.match(css, /\.profile-layout \{ width:min\(100% - 40px,760px\); grid-template-columns:1fr;/);
    assert.match(css, /@media\(max-width:600px\)/);
    assert.match(css, /\.profile-details \{ grid-template-columns:1fr; \}/);
    assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
