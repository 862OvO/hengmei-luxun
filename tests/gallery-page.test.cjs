const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"gallery.html"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/css/gallery.css"),"utf8");
const js=fs.readFileSync(path.join(root,"assets/js/gallery.js"),"utf8");

test("历史影像页加载独立档案模块且无占位说明",()=>{
    assert.match(html,/assets\/css\/gallery\.css/);
    assert.match(html,/assets\/js\/gallery\.js/);
    assert.match(html,/data-gallery-timeline/);
    assert.doesNotMatch(html,/占位图|后续由管理员|待核对/);
});

test("页面提供搜索、四个类型筛选和年代分组",()=>{
    assert.match(html,/data-gallery-search/);
    assert.equal((html.match(/data-gallery-filter=/g)||[]).length,4);
    assert.match(js,/早年与求学/);
    assert.match(js,/北京时期/);
    assert.match(js,/上海十年/);
});

test("灯箱支持前后切换、关闭和独立详情入口",()=>{
    assert.match(html,/data-gallery-lightbox/);
    assert.match(html,/data-lightbox-previous/);
    assert.match(html,/data-lightbox-next/);
    assert.match(html,/data-lightbox-detail/);
    assert.match(js,/ArrowLeft/);
    assert.match(js,/ArrowRight/);
    assert.match(js,/showModal/);
});

test("影像页提供窄屏和减少动画布局",()=>{
    assert.match(css,/@media\(max-width:560px\)/);
    assert.match(css,/prefers-reduced-motion/);
});
