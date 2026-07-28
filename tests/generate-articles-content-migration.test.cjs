const test = require("node:test");
const assert = require("node:assert/strict");
const { TARGET_SLUGS, createMigrationSql, findTargetRecords } = require("../scripts/generate-articles-content-migration.cjs");

const createRecord = (slug) => ({ content_type:"articles", slug, title:slug, summary:"摘要", body:"正文", image_path:`assets/${slug}.webp`, metadata:{genre_group:"小说"}, status:"published", sort_order:10 });

test("迁移选择固定六篇赏析并保持顺序", () => {
    const records = [...TARGET_SLUGS].reverse().map(createRecord);
    assert.deepEqual(findTargetRecords(records).map((item) => item.slug), TARGET_SLUGS);
    assert.throws(() => findTargetRecords(records.slice(1)), /应恰好匹配 1 条/);
});

test("迁移只更新六条已有赏析内容", () => {
    const sql = createMigrationSql(TARGET_SLUGS.map(createRecord));
    assert.match(sql, /^begin;/);
    assert.match(sql, /commit;\s*$/);
    assert.match(sql, /if v_updated <> 6/);
    assert.match(sql, /target\.deleted_at is null/);
    assert.match(sql, /image_path = source\.image_path/);
    assert.match(sql, /metadata = source\.metadata/);
    assert.doesNotMatch(sql, /insert into public\.contents/i);
});
