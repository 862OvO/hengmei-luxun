const test = require("node:test");
const assert = require("node:assert/strict");

const {
    TARGET_SLUGS,
    createMigrationSql,
    findTargetRecords,
    pickContentMetadata
} = require(
    "../scripts/generate-works-content-migration.cjs"
);

function createRecord(slug) {
    return {
        content_type: "works",
        slug,
        summary: `${slug} 摘要`,
        body: `${slug} 正文`,
        image_path:
            `assets/images/works/${slug}.webp`,
        metadata: {
            year: "2026",
            genre: "测试",
            references: [
                {
                    id: 1,
                    title: "资料"
                }
            ],
            image_type: "original",
            image_caption: "不得进入迁移"
        }
    };
}

test("只选择固定五个目标作品并保持顺序", () => {
    const records = [
        createRecord("kuangren-riji"),
        ...[...TARGET_SLUGS]
            .reverse()
            .map(createRecord)
    ];

    assert.deepEqual(
        findTargetRecords(records).map(
            (record) => record.slug
        ),
        TARGET_SLUGS
    );

    assert.throws(
        () =>
            findTargetRecords(
                records.filter(
                    (record) =>
                        record.slug !==
                        "guxiang"
                )
            ),
        /应恰好匹配 1 条/
    );
});

test("内容元数据排除所有 image_ 字段", () => {
    assert.deepEqual(
        pickContentMetadata({
            year: "1921",
            genre: "小说",
            references: [],
            image_type: "original",
            image_alt: "封面说明"
        }),
        {
            year: "1921",
            genre: "小说",
            references: []
        }
    );
});

test("迁移只更新五部正文和内容元数据", () => {
    const records =
        TARGET_SLUGS.map(createRecord);
    const sql = createMigrationSql(records);

    assert.match(sql, /^begin;/);
    assert.match(sql, /commit;\s*$/);
    assert.match(
        sql,
        /jsonb_to_recordset\(v_payload\)/
    );
    assert.match(sql, /if v_updated <> 5/);
    assert.match(sql, /target\.deleted_at is null/);

    for (const slug of TARGET_SLUGS) {
        assert.match(
            sql,
            new RegExp(`"slug": "${slug}"`)
        );
    }

    assert.doesNotMatch(sql, /kuangren-riji/);
    assert.doesNotMatch(sql, /image_path\s*=/);
    assert.doesNotMatch(sql, /image_type/);
    assert.doesNotMatch(sql, /sort_order\s*=/);
    assert.doesNotMatch(sql, /status\s*=/);
    assert.doesNotMatch(
        sql,
        /insert into public\.contents/
    );
});

test("相同数据重复生成完全一致", () => {
    const records =
        TARGET_SLUGS.map(createRecord);

    assert.equal(
        createMigrationSql(records),
        createMigrationSql(records)
    );
});
