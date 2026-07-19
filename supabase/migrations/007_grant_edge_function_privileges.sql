begin;

-- Edge Function 使用 service_role 检查管理员身份
grant usage
on schema public
to service_role;

grant select
on table public.profiles
to service_role;

-- 永久删除函数需要读取并删除回收站内容
grant select, delete
on table public.contents
to service_role;

commit;