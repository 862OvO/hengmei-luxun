const fs = require("fs");
const path = require("path");
const {
    spawnSync
} = require("child_process");

const ROOT = process.cwd();

const EXPECTED_PAGES = [
    "index.html",
    "biography.html",
    "works.html",
    "relations.html",
    "quotes.html",
    "history.html",
    "articles.html",
    "gallery.html",
    "detail.html",
    "search.html",
    "favorites.html",
    "messages.html",
    "auth.html",
    "profile.html",
    "admin.html"
];

const EXPECTED_DATA_COUNTS = {
    "assets/data/works.json": 6,
    "assets/data/articles.json": 6,
    "assets/data/gallery.json": 6
};

const ignoredProtocols = [
    "http://",
    "https://",
    "//",
    "mailto:",
    "tel:",
    "javascript:",
    "data:"
];

const errors = [];
const warnings = [];
const passed = [];

function normalizeRelativeReference(reference) {
    const clean = reference
        .split("#")[0]
        .split("?")[0]
        .trim();

    if (
        !clean ||
        clean === "/" ||
        clean.startsWith("#") ||
        ignoredProtocols.some(
            (protocol) =>
                clean.startsWith(protocol)
        )
    ) {
        return null;
    }

    return decodeURIComponent(clean);
}

function readText(filePath) {
    return fs.readFileSync(
        filePath,
        "utf8"
    );
}

const ignoredDirectories = new Set([
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    ".supabase",
    ".temp",
    "dist",
    "coverage"
]);

function walkFiles(directory) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const results = [];

    for (
        const entry of
        fs.readdirSync(
            directory,
            {
                withFileTypes: true
            }
        )
    ) {
        if (
            entry.isDirectory() &&
            ignoredDirectories.has(
                entry.name
            )
        ) {
            continue;
        }

        const fullPath =
            path.join(
                directory,
                entry.name
            );

        if (entry.isDirectory()) {
            results.push(
                ...walkFiles(fullPath)
            );
        } else {
            results.push(fullPath);
        }
    }

    return results;
}

function relative(filePath) {
    return path
        .relative(ROOT, filePath)
        .replaceAll("\\", "/");
}

function checkExpectedPages() {
    for (const page of EXPECTED_PAGES) {
        const fullPath =
            path.join(ROOT, page);

        if (!fs.existsSync(fullPath)) {
            errors.push(
                `缺少页面：${page}`
            );
        }
    }

    if (
        !errors.some(
            (item) =>
                item.startsWith(
                    "缺少页面："
                )
        )
    ) {
        passed.push(
            `核心页面检查通过（${EXPECTED_PAGES.length} 个）`
        );
    }
}

function checkLocalReferences() {
    const htmlFiles =
        walkFiles(ROOT)
            .filter(
                (filePath) =>
                    filePath.endsWith(
                        ".html"
                    )
            );

    const attributePattern =
        /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

    let checked = 0;

    for (const htmlFile of htmlFiles) {
        const source =
            readText(htmlFile);

        let match;

        while (
            (
                match =
                    attributePattern.exec(
                        source
                    )
            )
        ) {
            const normalized =
                normalizeRelativeReference(
                    match[1]
                );

            if (!normalized) {
                continue;
            }

            checked += 1;

            const target =
                normalized.startsWith("/")
                    ? path.join(
                        ROOT,
                        normalized.slice(1)
                    )
                    : path.resolve(
                        path.dirname(
                            htmlFile
                        ),
                        normalized
                    );

            if (!fs.existsSync(target)) {
                errors.push(
                    [
                        "本地资源不存在：",
                        relative(htmlFile),
                        " → ",
                        match[1]
                    ].join("")
                );
            }
        }
    }

    if (
        !errors.some(
            (item) =>
                item.startsWith(
                    "本地资源不存在："
                )
        )
    ) {
        passed.push(
            `HTML 本地链接检查通过（${checked} 个引用）`
        );
    }
}

function checkJsonData() {
    for (
        const [
            fileName,
            expectedCount
        ] of
        Object.entries(
            EXPECTED_DATA_COUNTS
        )
    ) {
        const fullPath =
            path.join(
                ROOT,
                fileName
            );

        if (!fs.existsSync(fullPath)) {
            errors.push(
                `缺少数据文件：${fileName}`
            );

            continue;
        }

        try {
            const value =
                JSON.parse(
                    readText(
                        fullPath
                    )
                );

            if (!Array.isArray(value)) {
                errors.push(
                    `${fileName} 顶层必须是数组`
                );

                continue;
            }

            if (
                value.length !==
                expectedCount
            ) {
                warnings.push(
                    `${fileName} 当前 ${value.length} 条，固定备用快照预期 ${expectedCount} 条`
                );
            }

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

            value.forEach(
                (item, index) => {
                    for (
                        const field of
                        requiredFields
                    ) {
                        if (
                            !Object.prototype
                                .hasOwnProperty
                                .call(
                                    item,
                                    field
                                )
                        ) {
                            errors.push(
                                `${fileName} 第 ${index + 1} 条缺少字段：${field}`
                            );
                        }
                    }
                }
            );
        } catch (error) {
            errors.push(
                `${fileName} JSON 解析失败：${error.message}`
            );
        }
    }

    if (
        !errors.some(
            (item) =>
                item.includes(
                    "JSON"
                ) ||
                item.includes(
                    "数据文件"
                ) ||
                item.includes(
                    "缺少字段"
                ) ||
                item.includes(
                    "顶层必须"
                )
        )
    ) {
        passed.push(
            "本地 JSON 快照检查通过"
        );
    }
}

function checkJavaScriptSyntax() {
    const jsDirectory =
        path.join(
            ROOT,
            "assets",
            "js"
        );

    const jsFiles =
        walkFiles(jsDirectory)
            .filter(
                (filePath) =>
                    filePath.endsWith(
                        ".js"
                    )
            );

    for (const jsFile of jsFiles) {
        const result =
            spawnSync(
                process.execPath,
                [
                    "--check",
                    jsFile
                ],
                {
                    encoding: "utf8"
                }
            );

        if (result.status !== 0) {
            errors.push(
                `JavaScript 语法错误：${relative(jsFile)}\n${result.stderr.trim()}`
            );
        }
    }

    if (
        !errors.some(
            (item) =>
                item.startsWith(
                    "JavaScript 语法错误："
                )
        )
    ) {
        passed.push(
            `JavaScript 语法检查通过（${jsFiles.length} 个文件）`
        );
    }
}

function checkMigrationSequence() {
    const directory =
        path.join(
            ROOT,
            "supabase",
            "migrations"
        );

    const files =
        walkFiles(directory)
            .map(relative)
            .filter(
                (fileName) =>
                    /^\s*supabase\/migrations\/\d{3}_.+\.sql$/i
                        .test(fileName)
            )
            .sort();

    const numbers =
        files.map(
            (fileName) =>
                Number(
                    path
                        .basename(fileName)
                        .slice(0, 3)
                )
        );

    const duplicates =
        numbers.filter(
            (value, index) =>
                numbers.indexOf(value) !==
                index
        );

    if (duplicates.length > 0) {
        errors.push(
            `迁移编号重复：${[
                ...new Set(
                    duplicates
                )
            ].join(", ")}`
        );
    }

    for (
        let index = 1;
        index < numbers.length;
        index += 1
    ) {
        if (
            numbers[index] !==
            numbers[index - 1] + 1
        ) {
            warnings.push(
                `迁移编号可能不连续：${numbers[index - 1]
                    .toString()
                    .padStart(3, "0")} → ${numbers[index]
                    .toString()
                    .padStart(3, "0")}`
            );
        }
    }

    passed.push(
        `Supabase 迁移文件检查完成（${files.length} 个）`
    );
}

function checkSensitivePatterns() {
    const clientPath =
        path.join(
            ROOT,
            "assets",
            "js",
            "supabase-client.js"
        );

    if (!fs.existsSync(clientPath)) {
        errors.push(
            "缺少 assets/js/supabase-client.js"
        );

        return;
    }

    const source =
        readText(clientPath);

    const dangerousPatterns = [
        /service_role/i,
        /SUPABASE_SERVICE_ROLE_KEY/i,
        /secret[_-]?key/i
    ];

    for (
        const pattern of
        dangerousPatterns
    ) {
        if (pattern.test(source)) {
            errors.push(
                `前端 Supabase 配置疑似包含后台密钥标识：${pattern}`
            );
        }
    }

    if (
        !errors.some(
            (item) =>
                item.startsWith(
                    "前端 Supabase 配置疑似"
                )
        )
    ) {
        passed.push(
            "前端密钥风险关键字检查通过"
        );
    }
}

function printSection(
    title,
    items
) {
    console.log(`\n${title}`);

    if (items.length === 0) {
        console.log("  无");
        return;
    }

    items.forEach(
        (item) => {
            console.log(
                `  - ${item}`
            );
        }
    );
}

function main() {
    console.log(
        "横眉·鲁迅文化数字展馆｜项目自动验收"
    );
    console.log(
        `项目目录：${ROOT}`
    );

    checkExpectedPages();
    checkLocalReferences();
    checkJsonData();
    checkJavaScriptSyntax();
    checkMigrationSequence();
    checkSensitivePatterns();

    printSection(
        "通过项目",
        passed
    );

    printSection(
        "警告",
        warnings
    );

    printSection(
        "错误",
        errors
    );

    console.log(
        "\n--------------------------------"
    );

    if (errors.length > 0) {
        console.log(
            `验收未通过：${errors.length} 个错误，${warnings.length} 个警告`
        );
        process.exitCode = 1;
        return;
    }

    console.log(
        `自动验收通过：0 个错误，${warnings.length} 个警告`
    );
}

main();
