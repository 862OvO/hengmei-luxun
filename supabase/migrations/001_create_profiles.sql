-- =========================================
-- 横眉·鲁迅文化数字展馆
-- 用户资料表、唯一昵称、触发器与 RLS
-- =========================================

-- 1. 用户资料表
create table if not exists public.profiles (
    id uuid
        primary key
        references auth.users(id)
        on delete cascade,

    nickname text not null,

    created_at timestamptz
        not null
        default timezone('utc'::text, now()),

    updated_at timestamptz
        not null
        default timezone('utc'::text, now()),

    constraint profiles_nickname_length
        check (
            char_length(nickname) between 2 and 20
        ),

    constraint profiles_nickname_format
        check (
            nickname ~ '^[\u4e00-\u9fffA-Za-z0-9_]+$'
        )
);

-- 2. 昵称不区分英文大小写
create unique index if not exists
profiles_nickname_lower_unique
on public.profiles (lower(nickname));

-- 3. 自动更新时间
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists
set_profiles_updated_at
on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

-- 4. 注册后自动创建用户资料
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    requested_nickname text;
begin
    requested_nickname :=
        btrim(new.raw_user_meta_data ->> 'nickname');

    if requested_nickname is null
       or requested_nickname = '' then
        raise exception 'nickname is required';
    end if;

    insert into public.profiles (
        id,
        nickname
    )
    values (
        new.id,
        requested_nickname
    );

    return new;
end;
$$;

drop trigger if exists
on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 5. 启用行级安全
alter table public.profiles
enable row level security;

-- 6. 撤销默认权限
revoke all
on table public.profiles
from anon;

revoke all
on table public.profiles
from authenticated;

-- 7. 登录用户只能查询资料
grant select
on table public.profiles
to authenticated;

-- 8. 登录用户只能更新 nickname 列
grant update (nickname)
on table public.profiles
to authenticated;

-- 9. 删除旧策略，便于重复执行迁移
drop policy if exists
"Users can read their own profile"
on public.profiles;

drop policy if exists
"Users can update their own profile"
on public.profiles;

-- 10. 用户只能读取自己的资料
create policy
"Users can read their own profile"
on public.profiles
for select
to authenticated
using (
    (select auth.uid()) = id
);

-- 11. 用户只能修改自己的资料
create policy
"Users can update their own profile"
on public.profiles
for update
to authenticated
using (
    (select auth.uid()) = id
)
with check (
    (select auth.uid()) = id
);