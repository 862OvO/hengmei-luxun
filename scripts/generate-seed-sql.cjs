const fs = require("node:fs");
const path = require("node:path");

const projectRoot =
    path.resolve(__dirname, "..");

const dataDirectory =
    path.join(
        projectRoot,
        "assets",
        "data"
    );

const outputPath =
    path.join(
        projectRoot,
        "supabase",
        "migrations",
        "003_seed_initial_contents.sql"
    );

const dataFiles = [
    "works",
    "articles",
    "gallery"
];

const allowedTypes =
    new Set(dataFiles);

const allowedStatuses =
    new Set([
        "draft",
        "published"
    ]);

const requiredFields = [
    "content_type",
    "slug",
    "title",
    "summary",
    "body",
    "metadata",
    "status",
    "sort_order"
];

const contents = [];
const uniqueKeys = new Set();

for (const fileName of dataFiles) {
    const filePath =
        path.join(
            dataDirectory,
            `${fileName}.json`
        );

    const source =
        fs.readFileSync(
            filePath,
            "utf8"
        );

    const records =
        JSON.parse(source);

    if (!Array.isArray(records)) {
        throw new Error(
            `${fileName}.json 顶层必须是数组。`
        );
    }

    if (records.length !== 6) {
        throw new Error(
            `${fileName}.json 应包含 6 条数据，当前为 ${records.length} 条。`
        );
    }

    for (const item of records) {
        for (const field of requiredFields) {
            if (
                !Object.prototype
                    .hasOwnProperty
                    .call(item, field)
            ) {
                throw new Error(
                    `${fileName}.json 中有数据缺少字段：${field}`
                );
            }
        }

        if (
            !allowedTypes.has(
                item.content_type
            )
        ) {
            throw new Error(
                `不支持的内容类型：${item.content_type}`
            );
        }

        if (
            item.content_type !==
            fileName
        ) {
            throw new Error(
                `${fileName}.json 中出现了错误类型：${item.content_type}`
            );
        }

        if (
            !allowedStatuses.has(
                item.status
            )
        ) {
            throw new Error(
                `不支持的状态：${item.status}`
            );
        }

        if (
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/
                .test(item.slug)
        ) {
            throw new Error(
                `slug 格式错误：${item.slug}`
            );
        }

        const uniqueKey =
            `${item.content_type}:${item.slug}`;

        if (uniqueKeys.has(uniqueKey)) {
            throw new Error(
                `发现重复内容编号：${uniqueKey}`
            );
        }

        uniqueKeys.add(uniqueKey);
        contents.push(item);
    }
}

if (contents.length !== 18) {
    throw new Error(
        `内容总数应为 18，当前为 ${contents.length}。`
    );
}

const jsonText =
    JSON.stringify(
        contents,
        null,
        2
    );

if (jsonText.includes("$seed_data$")) {
    throw new Error(
        "内容中出现了 SQL 分隔符，请更换分隔符。"
    );
}

const sql = `begin;

-- 本文件由 scripts/generate-seed-sql.cjs 自动生成
-- 数据来源：assets/data/*.json
-- 内容总数：${contents.length}

with seed_data as (
    select *
    from jsonb_to_recordset(
$seed_data$
${jsonText}
$seed_data$::jsonb
    ) as item (
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
)

insert into public.contents as existing (
    content_type,
    slug,
    title,
    summary,
    body,
    image_path,
    metadata,
    status,
    sort_order,
    published_at
)

select
    content_type,
    slug,
    title,
    summary,
    body,
    image_path,
    metadata,
    status,
    sort_order,
    case
        when status = 'published'
            then now()
        else null
    end
from seed_data

on conflict (
    content_type,
    slug
)

do update set
    title = excluded.title,
    summary = excluded.summary,
    body = excluded.body,
    image_path = excluded.image_path,
    metadata = excluded.metadata,
    status = excluded.status,
    sort_order = excluded.sort_order,

    published_at = case
        when excluded.status = 'published'
            then coalesce(
                existing.published_at,
                excluded.published_at
            )
        else null
    end,

    deleted_at = null,
    updated_at = now();

commit;
`;

fs.writeFileSync(
    outputPath,
    sql,
    "utf8"
);

console.log(
    "数据验证通过。"
);

console.log(
    `内容总数：${contents.length}`
);

console.log(
    "已生成：supabase/migrations/003_seed_initial_contents.sql"
);