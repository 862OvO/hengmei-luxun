const test=require("node:test");
const assert=require("node:assert/strict");
const {createMigrationSql,validateGallery}=require("../scripts/generate-gallery-content-migration.cjs");
const records=Array.from({length:18},(_,index)=>({content_type:"gallery",slug:`gallery-${index+1}`,title:"标题",summary:"摘要",body:"正文",image_path:"image.jpg",metadata:{},status:"published",sort_order:index+1}));

test("迁移要求恰好十八条唯一影像",()=>{
    assert.equal(validateGallery(records).length,18);
    assert.throws(()=>validateGallery(records.slice(1)),/应为 18 条/);
    assert.throws(()=>validateGallery([...records.slice(0,17),records[0]]),/slug 不合法/);
});

test("迁移执行 upsert、清理旧占位记录并核验数量",()=>{
    const sql=createMigrationSql(records);
    assert.match(sql,/on conflict \(content_type, slug\)/);
    assert.match(sql,/not exists \(/);
    assert.match(sql,/deleted_at = now\(\)/);
    assert.match(sql,/v_count <> 18/);
    assert.match(sql,/commit;\s*$/);
});
