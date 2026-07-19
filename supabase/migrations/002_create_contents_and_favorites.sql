begin;

-- =========================================================
-- 1. 为 profiles 增加用户角色
-- =========================================================

alter table public.profiles
add column if not exists role text not null default 'user';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_role_check'
    ) then
        alter table public.profiles
        add constraint profiles_role_check
        check (role in ('user', 'admin'));
    end if;
end
$$;

create index if not exists profiles_role_idx
on public.profiles (role);


-- =========================================================
-- 2. 管理员身份检查函数
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
    );
$$;

revoke all
on function public.is_admin()
from public;

grant execute
on function public.is_admin()
to anon, authenticated;


-- =========================================================
-- 3. 统一内容表
-- =========================================================

create table if not exists public.contents (
    id uuid primary key default gen_random_uuid(),

    content_type text not null,
    slug text not null,

    title text not null,
    summary text not null default '',
    body text not null default '',

    image_path text,

    metadata jsonb not null
        default '{}'::jsonb,

    status text not null
        default 'draft',

    sort_order integer not null
        default 0,

    published_at timestamptz,
    deleted_at timestamptz,

    created_by uuid
        references auth.users(id)
        on delete set null,

    updated_by uuid
        references auth.users(id)
        on delete set null,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint contents_content_type_check
        check (
            content_type in (
                'works',
                'articles',
                'gallery'
            )
        ),

    constraint contents_status_check
        check (
            status in (
                'draft',
                'published'
            )
        ),

    constraint contents_slug_check
        check (
            slug ~
            '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        ),

    constraint contents_type_slug_unique
        unique (
            content_type,
            slug
        )
);


-- =========================================================
-- 4. 内容表索引
-- =========================================================

create index if not exists contents_public_list_idx
on public.contents (
    content_type,
    status,
    sort_order,
    updated_at desc
)
where deleted_at is null;

create index if not exists contents_deleted_at_idx
on public.contents (deleted_at);

create index if not exists contents_updated_at_idx
on public.contents (updated_at desc);

create index if not exists contents_metadata_gin_idx
on public.contents
using gin (metadata);


-- =========================================================
-- 5. 自动更新时间
-- =========================================================

create or replace function
public.set_contents_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists
set_contents_updated_at_trigger
on public.contents;

create trigger
set_contents_updated_at_trigger
before update
on public.contents
for each row
execute function
public.set_contents_updated_at();


-- =========================================================
-- 6. contents 行级安全策略
-- =========================================================

alter table public.contents
enable row level security;

drop policy if exists
"Public can read published contents"
on public.contents;

create policy
"Public can read published contents"
on public.contents
for select
to anon, authenticated
using (
    status = 'published'
    and deleted_at is null
);

drop policy if exists
"Admins can read all contents"
on public.contents;

create policy
"Admins can read all contents"
on public.contents
for select
to authenticated
using (
    public.is_admin()
);

drop policy if exists
"Admins can create contents"
on public.contents;

create policy
"Admins can create contents"
on public.contents
for insert
to authenticated
with check (
    public.is_admin()
);

drop policy if exists
"Admins can update contents"
on public.contents;

create policy
"Admins can update contents"
on public.contents
for update
to authenticated
using (
    public.is_admin()
)
with check (
    public.is_admin()
);

drop policy if exists
"Admins can delete contents"
on public.contents;

create policy
"Admins can delete contents"
on public.contents
for delete
to authenticated
using (
    public.is_admin()
);

grant select
on public.contents
to anon, authenticated;

grant insert, update, delete
on public.contents
to authenticated;


-- =========================================================
-- 7. 收藏表
-- =========================================================

create table if not exists public.favorites (
    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    content_id uuid not null
        references public.contents(id)
        on delete cascade,

    created_at timestamptz not null
        default now(),

    constraint favorites_user_content_unique
        unique (
            user_id,
            content_id
        )
);


-- =========================================================
-- 8. 收藏表索引
-- =========================================================

create index if not exists favorites_user_created_idx
on public.favorites (
    user_id,
    created_at desc
);

create index if not exists favorites_content_idx
on public.favorites (content_id);


-- =========================================================
-- 9. favorites 行级安全策略
-- =========================================================

alter table public.favorites
enable row level security;

drop policy if exists
"Users can read own favorites"
on public.favorites;

create policy
"Users can read own favorites"
on public.favorites
for select
to authenticated
using (
    auth.uid() = user_id
);

drop policy if exists
"Users can create own favorites"
on public.favorites;

create policy
"Users can create own favorites"
on public.favorites
for insert
to authenticated
with check (
    auth.uid() = user_id
    and exists (
        select 1
        from public.contents
        where contents.id = content_id
          and contents.status = 'published'
          and contents.deleted_at is null
    )
);

drop policy if exists
"Users can delete own favorites"
on public.favorites;

create policy
"Users can delete own favorites"
on public.favorites
for delete
to authenticated
using (
    auth.uid() = user_id
);

grant select, insert, delete
on public.favorites
to authenticated;

revoke all
on public.favorites
from anon;

commit;