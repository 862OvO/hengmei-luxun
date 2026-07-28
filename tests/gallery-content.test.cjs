const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname,"..");
const data = JSON.parse(fs.readFileSync(path.join(root,"assets/data/gallery.json"),"utf8"));

test("历史影像包含十八份唯一档案和约定类型", () => {
    assert.equal(data.length,18);
    assert.equal(new Set(data.map((item)=>item.slug)).size,18);
    const counts=data.reduce((all,item)=>({...all,[item.metadata.category]:(all[item.metadata.category]||0)+1}),{});
    assert.deepEqual(counts,{地点:5,人物:10,文献:3});
});

test("每份档案均有语境、来源和授权", () => {
    data.forEach((item)=>{
        assert.ok(item.body.length>=450,`${item.slug} 说明过短`);
        assert.match(item.body,/## 档案说明/);
        assert.match(item.body,/## 画面细读/);
        assert.match(item.body,/## 历史坐标/);
        assert.match(item.body,/## 来源与授权/);
        assert.match(item.metadata.source_url,/^https:\/\/commons\.wikimedia\.org\//);
        assert.match(item.metadata.license,/^(Public Domain|CC BY-SA)/);
        assert.ok(item.metadata.creator);
        assert.ok(item.metadata.display_date);
        assert.ok(item.metadata.timeline_label);
    });
});

test("全部本地影像存在且不再使用占位图", () => {
    data.forEach((item)=>{
        assert.doesNotMatch(item.image_path,/placeholder/i);
        assert.ok(fs.existsSync(path.join(root,item.image_path)),`${item.slug} 图片不存在`);
        assert.ok(item.metadata.alt.length>=8);
    });
});

test("每份档案都有站内关联阅读", () => data.forEach((item)=>{
    assert.equal(item.metadata.related_links.length,2);
    item.metadata.related_links.forEach((link)=>assert.doesNotMatch(link.url,/^http:/));
}));
