import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile =
    fileURLToPath(
        import.meta.url
    );

const projectRoot =
    path.resolve(
        path.dirname(currentFile),
        ".."
    );

const parserPath =
    path.join(
        projectRoot,
        "assets",
        "js",
        "detail-body-parser.js"
    );

const parserSource =
    await fs.readFile(
        parserPath,
        "utf8"
    );

const parserModule =
    await import(
        `data:text/javascript;base64,${Buffer
            .from(parserSource)
            .toString("base64")}`
    );

const {
    parseDetailBody,
    collectReferenceNumbers
} = parserModule;

test(
    "解析标题、段落、引文、列表和参考资料",
    () => {
        const source = [
            "## 作品导读",
            "",
            "正文内容[1]。",
            "",
            "> 短引。",
            "> ——《狂人日记》",
            "",
            "- 要点一",
            "- 要点二",
            "",
            "## 参考资料",
            "",
            "[1] 资料名称 https://example.com/source"
        ].join("\n");

        const blocks =
            parseDetailBody(source);

        assert.deepEqual(
            blocks,
            [
                {
                    type: "heading",
                    text: "作品导读",
                    isReferenceHeading: false
                },
                {
                    type: "paragraph",
                    text: "正文内容[1]。"
                },
                {
                    type: "quote",
                    lines: [
                        "短引。",
                        "——《狂人日记》"
                    ]
                },
                {
                    type: "list",
                    items: [
                        "要点一",
                        "要点二"
                    ]
                },
                {
                    type: "heading",
                    text: "参考资料",
                    isReferenceHeading: true
                },
                {
                    type: "reference",
                    number: "1",
                    text:
                        "资料名称 https://example.com/source"
                }
            ]
        );

        assert.deepEqual(
            [
                ...collectReferenceNumbers(
                    blocks
                )
            ],
            ["1"]
        );
    }
);

test(
    "兼容旧正文的普通段落",
    () => {
        assert.deepEqual(
            parseDetailBody(
                "第一段。\r\n\r\n第二段。"
            ),
            [
                {
                    type: "paragraph",
                    text: "第一段。"
                },
                {
                    type: "paragraph",
                    text: "第二段。"
                }
            ]
        );
    }
);

test(
    "未支持标记按普通文字保留",
    () => {
        assert.deepEqual(
            parseDetailBody(
                "### 未支持标题\n普通文字"
            ),
            [
                {
                    type: "paragraph",
                    text:
                        "### 未支持标题 普通文字"
                }
            ]
        );
    }
);

test(
    "空正文返回空块数组",
    () => {
        assert.deepEqual(
            parseDetailBody(" \r\n "),
            []
        );
    }
);
