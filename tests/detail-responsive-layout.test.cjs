const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.join(
    __dirname,
    '..',
    'assets',
    'css',
    'detail.css'
);

function readMediaBlock(css, query) {
    const start = css.indexOf(`@media (${query})`);

    assert.notEqual(
        start,
        -1,
        `未找到媒体查询：${query}`
    );

    const openBrace = css.indexOf('{', start);
    let depth = 0;

    for (let index = openBrace; index < css.length; index += 1) {
        if (css[index] === '{') {
            depth += 1;
        } else if (css[index] === '}') {
            depth -= 1;

            if (depth === 0) {
                return css.slice(openBrace + 1, index);
            }
        }
    }

    throw new Error(`媒体查询未闭合：${query}`);
}

test('窄屏作品详情把侧栏和正文重置到同一网格列', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    const mediaBlock = readMediaBlock(css, 'max-width: 900px');

    assert.match(
        mediaBlock,
        /\.detail-article--works\s+\.detail-sidebar\s*,\s*\.detail-article--works\s+\.detail-content\s*\{[^}]*grid-column:\s*1\s*;[^}]*grid-row:\s*auto\s*;/s
    );
});

test('narrow article and gallery details reuse the single-column works fix', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    const mediaBlock = readMediaBlock(css, 'max-width: 900px');

    assert.match(
        mediaBlock,
        /\.detail-article--articles\s+\.detail-layout\s*,\s*\.detail-article--gallery\s+\.detail-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s
    );
    assert.match(
        mediaBlock,
        /\.detail-article--articles\s+\.detail-sidebar\s*,[\s\S]*?\.detail-article--gallery\s+\.detail-content\s*\{[^}]*grid-column:\s*1\s*;[^}]*grid-row:\s*auto\s*;[^}]*min-width:\s*0\s*;/s
    );
});
