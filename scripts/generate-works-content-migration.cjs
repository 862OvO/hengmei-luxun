const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const TARGET_SLUGS = Object.freeze([
    "aq-zhengzhuan",
    "guxiang",
    "zhufu",
    "zhaohua-xishi",
    "yecao"
]);

function pickContentMetadata(metadata) {
    return Object.fromEntries(
        Object.entries(
            metadata &&
            typeof metadata === "object" &&
            !Array.isArray(metadata)
                ? metadata
                : {}
        ).filter(
            ([key]) => !key.startsWith("image_")
        )
    );
}

function findTargetRecords(records) {
    return TARGET_SLUGS.map((slug) => {
        const matches = records.filter(
            (record) =>
                record.content_type === "works" &&
                record.slug === slug
        );

        if (matches.length !== 1) {
            throw new Error(
                `works:${slug} 应恰好匹配 1 条，当前为 ${matches.length} 条。`
            );
        }

        return matches[0];
    });
}

function createMigrationSql(records) {
    const targets = findTargetRecords(records);
    const payload = targets.map((record) => ({
        content_type: record.content_type,
        slug: record.slug,
        summary: record.summary,
        body: record.body,
        metadata: pickContentMetadata(
            record.metadata
        )
    }));
    const jsonText = JSON.stringify(
        payload,
        null,
        2
    );
    const delimiter = "$content_update$";

    if (jsonText.includes(delimiter)) {
        throw new Error("内容中出现 SQL 分隔符。");
    }

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
        summary = source.summary,
        body = source.body,
        metadata =
            coalesce(
                target.metadata,
                '{}'::jsonb
            )
            ||
            coalesce(
                source.metadata,
                '{}'::jsonb
            ),
        updated_at = now()
    from jsonb_to_recordset(v_payload) as source(
        content_type text,
        slug text,
        summary text,
        body text,
        metadata jsonb
    )
    where target.content_type =
            source.content_type
      and target.slug = source.slug
      and target.deleted_at is null;

    get diagnostics
        v_updated = row_count;

    if v_updated <> 5 then
        raise exception
            'Expected exactly five active content rows, updated %',
            v_updated;
    end if;
end
$migration$;

commit;
`;
}

function main() {
    const dataPath = path.join(
        projectRoot,
        "assets",
        "data",
        "works.json"
    );
    const records = JSON.parse(
        fs.readFileSync(dataPath, "utf8")
    );
    const outputPath = path.join(
        projectRoot,
        "supabase",
        "migrations",
        "013_update_remaining_works_content.sql"
    );

    fs.mkdirSync(path.dirname(outputPath), {
        recursive: true
    });
    fs.writeFileSync(
        outputPath,
        createMigrationSql(records),
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
    TARGET_SLUGS,
    createMigrationSql,
    findTargetRecords,
    pickContentMetadata
};
