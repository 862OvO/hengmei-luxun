const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");const root=path.resolve(__dirname,"..");const data=JSON.parse(fs.readFileSync(path.join(root,"assets/data/quotes.json"),"utf8"));
test("语录库包含二十四条唯一记录和六个均衡分类",()=>{assert.equal(data.quotes.length,24);assert.equal(new Set(data.quotes.map(x=>x.id)).size,24);const counts=data.quotes.reduce((a,x)=>({...a,[x.category]:(a[x.category]||0)+1}),{});assert.deepEqual(counts,{youth:4,writing:4,society:4,life:4,children:4,memory:4});});
test("每条语录都有具体篇名、年份、语境和出处",()=>data.quotes.forEach(q=>{assert.ok(q.text.length>=8);assert.match(q.sourceTitle,/《.+》/);assert.match(q.year,/^\d{4}$/);assert.ok(q.context.length>=35);assert.ok(q.keywords.length>=3);assert.match(q.sourceUrl,/^(https:\/\/|detail\.html)/);}));
test("排除常见来源不明的网络归因",()=>{const all=data.quotes.map(q=>q.text).join(" ");assert.doesNotMatch(all,/海绵里的水|教育植根于爱|浪费自己的时间/);});
test("资料入口完整且使用 HTTPS",()=>{assert.ok(data.references.length>=4);data.references.forEach(r=>assert.match(r.url,/^https:\/\//));});

