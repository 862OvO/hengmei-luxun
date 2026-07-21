const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function escapeSqlLiteral(value) {
    return String(value).replace(/'/g, "''");
}

function findRecord(records, contentType, slug) {
    const matches = records.filter(
        (record) =>
            record.content_type === contentType &&
            record.slug === slug
    );

    if (matches.length !== 1) {
        throw new Error(
            `${contentType}:${slug} 应恰好匹配 1 条，当前为 ${matches.length} 条。`
        );
    }

    return matches[0];
}

function createMigrationSql(record) {
    const payload = {
        summary: record.summary,
        body: record.body,
        image_path: record.image_path,
        metadata: record.metadata
    };

    const jsonText = JSON.stringify(payload, null, 2);
    const delimiter = "$content_update$";

    if (jsonText.includes(delimiter)) {
        throw new Error("内容中出现 SQL 分隔符。");
    }

    const contentType = escapeSqlLiteral(record.content_type);
    const slug = escapeSqlLiteral(record.slug);

    return `begin;

do $migration$
declare
    v_payload jsonb :=
        ($content_update$
${jsonText}
$content_update$)::jsonb;

    v_updated integer;
begin
    update public.contents as target
    set
        summary =
            v_payload ->> 'summary',

        body =
            v_payload ->> 'body',

        image_path =
            nullif(
                v_payload ->> 'image_path',
                ''
            ),

        metadata =
            coalesce(
                target.metadata,
                '{}'::jsonb
            )
            ||
            coalesce(
                v_payload -> 'metadata',
                '{}'::jsonb
            ),

        updated_at = now()

    where target.content_type = '${contentType}'
      and target.slug = '${slug}'
      and target.deleted_at is null;

    get diagnostics
        v_updated = row_count;

    if v_updated <> 1 then
        raise exception
            'Expected exactly one active content row, updated %',
            v_updated;
    end if;
end
$migration$;

commit;
`;
}

function main() {
    const [contentType, slug, outputFileName] = process.argv.slice(2);

    if (!contentType || !slug || !outputFileName) {
        throw new Error(
            "用法：node scripts/generate-single-content-migration.cjs " +
            "<contentType> <slug> <outputFileName>"
        );
    }

    if (
        !/^[a-z0-9-]+$/.test(contentType) ||
        !/^[a-z0-9-]+$/.test(slug)
    ) {
        throw new Error(
            "contentType 和 slug 只能包含小写字母、数字和连字符。"
        );
    }

    if (
        path.basename(outputFileName) !== outputFileName ||
        !/^\d{3}_[a-z0-9_]+\.sql$/.test(outputFileName)
    ) {
        throw new Error(
            "输出文件名必须为三位编号开头的 SQL 文件名。"
        );
    }

    const dataPath = path.join(
        projectRoot,
        "assets",
        "data",
        `${contentType}.json`
    );

    const records = JSON.parse(
        fs.readFileSync(dataPath, "utf8")
    );

    const record = findRecord(records, contentType, slug);

    const outputPath = path.join(
        projectRoot,
        "supabase",
        "migrations",
        outputFileName
    );

    fs.mkdirSync(path.dirname(outputPath), {
        recursive: true
    });

    fs.writeFileSync(
        outputPath,
        createMigrationSql(record),
        "utf8"
    );

    console.log(`已生成：${outputPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = {
    createMigrationSql,
    findRecord
};
