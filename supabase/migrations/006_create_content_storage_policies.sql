begin;

-- =========================================================
-- 文化内容图片 Storage 权限
--
-- Bucket：
-- content-images
--
-- 规则：
-- 1. Bucket 为公开读取
-- 2. 只有管理员可以查看对象列表
-- 3. 只有管理员可以上传、更新和删除
-- =========================================================


-- 管理员可以查看对象列表

drop policy if exists
"Admins can list content images"
on storage.objects;

create policy
"Admins can list content images"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'content-images'
    and public.is_admin()
);


-- 管理员可以上传图片

drop policy if exists
"Admins can upload content images"
on storage.objects;

create policy
"Admins can upload content images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'content-images'
    and public.is_admin()
);


-- 管理员可以更新图片
-- 后续若需要 upsert，会同时用到 SELECT 和 UPDATE 策略

drop policy if exists
"Admins can update content images"
on storage.objects;

create policy
"Admins can update content images"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'content-images'
    and public.is_admin()
)
with check (
    bucket_id = 'content-images'
    and public.is_admin()
);


-- 管理员可以删除图片

drop policy if exists
"Admins can delete content images"
on storage.objects;

create policy
"Admins can delete content images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'content-images'
    and public.is_admin()
);

commit;