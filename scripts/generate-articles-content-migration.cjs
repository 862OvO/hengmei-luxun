const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const TARGET_SLUGS = Object.freeze([
    "kuangren-riji-lijiao-pipan",
    "aq-jingshen-shenglifa",
    "guxiang-lu-yixiang",
    "zhufu-xianglinsao-beiju",
    "zhaohua-xishi-jiyi-yupipan",
    "yecao-xiangzheng-shijie"
]);

function findTargetRecords(records) {
    return TARGET_SLUGS.map((slug) => {
        const matches = records.filter((record) => record.content_type === "articles" && record.slug === slug);
        if (matches.length !== 1) {
            throw new Error(`articles:${slug} 应恰好匹配 1 条，当前为 ${matches.length} 条。`);
        }
        return matches[0];
    });
}

function createMigrationSql(records) {
    const payload = findTargetRecords(records);
    const jsonText = JSON.stringify(payload, null, 2);
    const delimiter = "$articles_update$";

    if (jsonText.includes(delimiter)) {
        throw new Error("内容中出现 SQL 分隔符。");
    }

    return `begin;

do $migration$
declare
    v_payload jsonb :=
        ($articles_update$
${jsonText}
$articles_update$)::jsonb;
    v_updated integer;
begin
    update public.contents as target
    set
        title = source.title,
        summary = source.summary,
        body = source.body,
        image_path = source.image_path,
        metadata = source.metadata,
        status = source.status,
        sort_order = source.sort_order,
        updated_at = now()
    from jsonb_to_recordset(v_payload) as source(
        content_type text,
        slug text,
        title text,
        summary text,
        body text,
        image_path text,
        metadata jsonb,
        status text,
        sort_order integer
    )
    where target.content_type = source.content_type
      and target.slug = source.slug
      and target.deleted_at is null;

    get diagnostics v_updated = row_count;

    if v_updated <> 6 then
        raise exception 'Expected exactly six active article rows, updated %', v_updated;
    end if;
end
$migration$;

commit;
`;
}

function main() {
    const records = JSON.parse(fs.readFileSync(path.join(projectRoot, "assets", "data", "articles.json"), "utf8"));
    const outputPath = path.join(projectRoot, "supabase", "migrations", "014_update_articles_content.sql");
    fs.writeFileSync(outputPath, createMigrationSql(records), "utf8");
    console.log(`已生成：${outputPath}`);
}

if (require.main === module) {
    try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { TARGET_SLUGS, createMigrationSql, findTargetRecords };
