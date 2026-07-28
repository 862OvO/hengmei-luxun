const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "assets/data/history.json"), "utf8"));

test("时代背景包含十八个唯一节点和约定分类", () => {
    assert.equal(data.events.length, 18);
    assert.equal(new Set(data.events.map((item) => item.id)).size, 18);
    const counts = data.events.reduce((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + 1 }), {});
    assert.deepEqual(counts, { crisis: 4, reform: 5, culture: 5, society: 4 });
});

test("每个历史节点说明史实、影响、关联内容与资料", () => {
    const refs = new Set(data.references.map((item) => item.id));
    data.events.forEach((event) => {
        assert.match(event.year, /^\d{4}$/);
        assert.ok(event.summary.length >= 35, `${event.id} 史实说明过短`);
        assert.ok(event.impact.length >= 35, `${event.id} 影响说明过短`);
        assert.ok(event.related.length >= 1);
        assert.ok(event.references.length >= 2);
        event.references.forEach((id) => assert.ok(refs.has(id), `${event.id} 引用不存在`));
    });
});

test("四个专题和六部作品坐标完整", () => {
    assert.equal(data.themes.length, 4);
    assert.equal(data.works.length, 6);
    const eventIds = new Set(data.events.map((item) => item.id));
    data.themes.forEach((theme) => {
        assert.ok(fs.existsSync(path.join(root, theme.image)));
        assert.ok(theme.imageAlt);
        assert.equal(theme.highlights.length, 3);
    });
    data.works.forEach((work) => work.eventIds.forEach((id) => assert.ok(eventIds.has(id))));
});

test("全部外部资料使用 HTTPS", () => data.references.forEach((item) => assert.match(item.url, /^https:\/\//)));

