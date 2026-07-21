const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const worksPath = path.join(projectRoot, "assets", "data", "works.json");
const registryPath = path.join(
    projectRoot,
    "docs",
    "鲁迅代表作品图片来源与授权登记.md"
);

const expected = {
    "kuangren-riji": {
        path: "assets/images/works/kuangren-riji-cover.webp",
        alt: "米白色民国书刊风格的《狂人日记》原创封面，含冷月、凝视眼睛与手稿意象"
    },
    "aq-zhengzhuan": {
        path: "assets/images/works/a-q-zhengzhuan-cover.webp",
        alt: "米白色民国书刊风格的《阿Q正传》原创封面，含未庄牌楼与辫影意象"
    },
    "guxiang": {
        path: "assets/images/works/guxiang-cover.webp",
        alt: "米白色民国书刊风格的《故乡》原创封面，含月夜、瓜田与远帆意象"
    },
    "zhufu": {
        path: "assets/images/works/zhufu-cover.webp",
        alt: "米白色民国书刊风格的《祝福》原创封面，含雪夜、门神与香火意象"
    },
    "zhaohua-xishi": {
        path: "assets/images/works/zhaohua-xishi-cover.webp",
        alt: "米白色民国书刊风格的《朝花夕拾》原创封面，含花枝、旧书与晨光意象"
    },
    "yecao": {
        path: "assets/images/works/yecao-cover.webp",
        alt: "米白色民国书刊风格的《野草》原创封面，含枣树、暗夜与星点意象"
    }
};

function readWorks() {
    return JSON.parse(fs.readFileSync(worksPath, "utf8"));
}

test("六部代表作品均接入统一原创 WebP 封面", () => {
    const works = readWorks();
    assert.equal(works.length, 6);

    for (const item of works) {
        const specification = expected[item.slug];
        assert.ok(specification, `发现未登记作品：${item.slug}`);
        assert.equal(item.image_path, specification.path);
        assert.equal(path.extname(item.image_path), ".webp");

        const imagePath = path.join(projectRoot, ...item.image_path.split("/"));
        assert.ok(fs.existsSync(imagePath), `封面文件不存在：${item.image_path}`);
        assert.ok(fs.statSync(imagePath).size > 100_000, `封面文件过小：${item.image_path}`);
    }
});

test("六部封面授权元数据完整且统一", () => {
    const works = readWorks();

    for (const item of works) {
        const specification = expected[item.slug];
        assert.equal(item.metadata.image_type, "original");
        assert.equal(item.metadata.image_caption, `《${item.title}》本站原创视觉封面`);
        assert.equal(item.metadata.image_creator, "横眉·鲁迅文化数字展馆");
        assert.equal(item.metadata.image_date, "2026");
        assert.equal(item.metadata.image_source, "本站原创");
        assert.equal(item.metadata.image_license, "本站原创，仅用于本课程项目与项目展示");
        assert.equal(item.metadata.image_alt, specification.alt);
    }
});

test("图片来源与授权登记覆盖六张封面", () => {
    const registry = fs.readFileSync(registryPath, "utf8");

    for (const specification of Object.values(expected)) {
        assert.match(registry, new RegExp(specification.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }

    assert.match(registry, /六部代表作品/);
    assert.match(registry, /不得冒充历史版本书影/);
});

test("封面迁移只更新六部作品的图片字段", () => {
    const migrationPath = path.join(
        projectRoot,
        "supabase",
        "migrations",
        "012_update_works_original_covers.sql"
    );
    assert.ok(fs.existsSync(migrationPath), "缺少封面更新迁移文件");

    const sql = fs.readFileSync(migrationPath, "utf8");
    for (const slug of Object.keys(expected)) {
        assert.match(sql, new RegExp(`"slug"\\s*:\\s*"${slug}"`));
    }

    assert.match(sql, /v_updated\s*<>\s*6/);
    assert.match(sql, /target\.content_type\s*=\s*'works'/);
    assert.doesNotMatch(sql, /body\s*=/);
    assert.doesNotMatch(sql, /summary\s*=/);
});
