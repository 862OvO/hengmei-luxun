const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "assets/data/relations.json"), "utf8"));

test("人物关系数据包含约定的十二人和三种类别", () => {
    assert.equal(data.people.length, 12);
    assert.equal(new Set(data.people.map((person) => person.id)).size, 12);
    const counts = data.people.reduce((result, person) => {
        result[person.category] = (result[person.category] || 0) + 1;
        return result;
    }, {});
    assert.deepEqual(counts, { family: 5, mentor: 3, peer: 4 });
});

test("每个人物都有完整简介、事件和可解析的资料引用", () => {
    const referenceIds = new Set(data.references.map((reference) => reference.id));
    data.people.forEach((person) => {
        assert.ok(person.name.length >= 2, `${person.id} 缺少姓名`);
        assert.ok(person.summary.length >= 20, `${person.name} 摘要过短`);
        assert.ok(person.detail.length >= 60, `${person.name} 详情过短`);
        assert.match(person.event.year, /^\d{4}$/);
        assert.ok(person.event.title && person.event.text);
        assert.ok(person.references.length >= 2, `${person.name} 至少需要两条引用`);
        person.references.forEach((id) => assert.ok(referenceIds.has(id), `${person.name} 引用了不存在的资料 ${id}`));
    });
});

test("所有外部资料使用 HTTPS，所有本地图片均存在", () => {
    data.references.forEach((reference) => assert.match(reference.url, /^https:\/\//));
    data.people.filter((person) => person.image).forEach((person) => {
        assert.ok(person.imageAlt);
        assert.ok(fs.existsSync(path.join(root, person.image)), `${person.image} 不存在`);
    });
});

test("首版人物名单与需求一致", () => {
    const expected = ["鲁瑞", "周作人", "周建人", "许广平", "周海婴", "藤野严九郎", "章太炎", "蔡元培", "钱玄同", "许寿裳", "瞿秋白", "萧红"];
    assert.deepEqual(data.people.map((person) => person.name).sort(), expected.sort());
});

