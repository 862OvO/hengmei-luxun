const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createMigrationSql,
    findRecord
} = require(
    "../scripts/generate-single-content-migration.cjs"
);

test(
    "只找到指定类型和 slug 的唯一记录",
    () => {
        const records = [
            {
                content_type: "works",
                slug: "kuangren-riji"
            },
            {
                content_type: "works",
                slug: "guxiang"
            }
        ];

        assert.deepEqual(
            findRecord(
                records,
                "works",
                "kuangren-riji"
            ),
            records[0]
        );

        assert.throws(
            () =>
                findRecord(
                    records,
                    "works",
                    "missing"
                ),
            /应恰好匹配 1 条/
        );
    }
);

test(
    "生成的 SQL 不修改状态、排序和其他内容",
    () => {
        const sql =
            createMigrationSql({
                content_type: "works",
                slug: "kuangren-riji",
                summary: "摘要",
                body: "正文",
                image_path:
                    "assets/images/works/cover.svg",
                metadata: {
                    year: "1918"
                }
            });

        assert.match(
            sql,
            /where target\.content_type = 'works'/
        );

        assert.match(
            sql,
            /and target\.slug = 'kuangren-riji'/
        );

        assert.match(
            sql,
            /get diagnostics\s+v_updated = row_count/
        );

        assert.match(
            sql,
            /if v_updated <> 1/
        );

        assert.match(
            sql,
            /target\.deleted_at is null/
        );

        assert.doesNotMatch(
            sql,
            /status\s*=/
        );

        assert.doesNotMatch(
            sql,
            /sort_order\s*=/
        );

        assert.doesNotMatch(
            sql,
            /insert into public\.contents/
        );
    }
);
