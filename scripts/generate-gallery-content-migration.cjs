const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function validateGallery(records) {
    if (records.length !== 18) throw new Error(`影像档案应为 18 条，当前为 ${records.length} 条。`);
    const slugs = new Set(records.map((item) => item.slug));
    if (slugs.size !== 18 || records.some((item) => item.content_type !== "gallery")) throw new Error("影像档案类型或 slug 不合法。");
    return records;
}

function createMigrationSql(records) {
    const payload = validateGallery(records);
    const json = JSON.stringify(payload, null, 2);
    return `begin;

create temporary table gallery_payload on commit drop as
select * from jsonb_to_recordset(
$gallery_update$
${json}
$gallery_update$::jsonb
) as item(
    content_type text,
    slug text,
    title text,
    summary text,
    body text,
    image_path text,
    metadata jsonb,
    status text,
    sort_order integer
);

insert into public.contents as existing (
    content_type, slug, title, summary, body, image_path,
    metadata, status, sort_order, published_at
)
select
    content_type, slug, title, summary, body, image_path,
    metadata, status, sort_order, now()
from gallery_payload
on conflict (content_type, slug)
do update set
    title = excluded.title,
    summary = excluded.summary,
    body = excluded.body,
    image_path = excluded.image_path,
    metadata = excluded.metadata,
    status = excluded.status,
    sort_order = excluded.sort_order,
    published_at = coalesce(existing.published_at, excluded.published_at),
    deleted_at = null,
    updated_at = now();

update public.contents as target
set deleted_at = now(), updated_at = now()
where target.content_type = 'gallery'
  and target.deleted_at is null
  and not exists (
      select 1 from gallery_payload as source
      where source.slug = target.slug
  );

do $verify$
declare v_count integer;
begin
    select count(*) into v_count
    from public.contents
    where content_type = 'gallery'
      and status = 'published'
      and deleted_at is null;
    if v_count <> 18 then
        raise exception 'Expected exactly 18 active gallery rows, found %', v_count;
    end if;
end
$verify$;

commit;
`;
}

function main() {
    const records = JSON.parse(fs.readFileSync(path.join(root,"assets","data","gallery.json"),"utf8"));
    const output = path.join(root,"supabase","migrations","015_update_gallery_content.sql");
    fs.writeFileSync(output,createMigrationSql(records),"utf8");
    console.log(`已生成：${output}`);
}

if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode=1; } }
module.exports = { createMigrationSql, validateGallery };
