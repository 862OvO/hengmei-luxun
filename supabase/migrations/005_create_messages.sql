begin;

-- =========================================================
-- 1. 文化留言表
-- =========================================================

create table if not exists public.messages (
    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    content text not null,

    status text not null
        default 'visible',

    hidden_reason text,

    hidden_at timestamptz,

    hidden_by uuid
        references auth.users(id)
        on delete set null,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now(),

    constraint messages_content_length_check
        check (
            char_length(
                btrim(content)
            ) between 1 and 500
        ),

    constraint messages_status_check
        check (
            status in (
                'visible',
                'hidden'
            )
        ),

    constraint messages_hidden_state_check
        check (
            (
                status = 'visible'
                and hidden_reason is null
                and hidden_at is null
                and hidden_by is null
            )
            or
            (
                status = 'hidden'
                and hidden_reason is not null
                and char_length(
                    btrim(hidden_reason)
                ) between 1 and 300
                and hidden_at is not null
                and hidden_by is not null
            )
        )
);


-- =========================================================
-- 2. 留言索引
-- =========================================================

create index if not exists
messages_status_created_idx
on public.messages (
    status,
    created_at desc
);

create index if not exists
messages_user_created_idx
on public.messages (
    user_id,
    created_at desc
);


-- =========================================================
-- 3. 自动更新时间
-- =========================================================

create or replace function
public.set_messages_updated_at()
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
set_messages_updated_at_trigger
on public.messages;

create trigger
set_messages_updated_at_trigger
before update
on public.messages
for each row
execute function
public.set_messages_updated_at();


-- =========================================================
-- 4. 开启行级安全
-- =========================================================

alter table public.messages
enable row level security;


-- 访客和登录用户只可读取正常公开留言

drop policy if exists
"Public can read visible messages"
on public.messages;

create policy
"Public can read visible messages"
on public.messages
for select
to authenticated
using (
    status = 'visible'
);


-- 登录用户只能以自己的身份发布留言

drop policy if exists
"Users can create own messages"
on public.messages;

create policy
"Users can create own messages"
on public.messages
for insert
to authenticated
with check (
    auth.uid() = user_id
    and status = 'visible'
    and hidden_reason is null
    and hidden_at is null
    and hidden_by is null
);


-- 用户只能编辑自己的正常留言

drop policy if exists
"Users can update own visible messages"
on public.messages;

create policy
"Users can update own visible messages"
on public.messages
for update
to authenticated
using (
    auth.uid() = user_id
    and status = 'visible'
)
with check (
    auth.uid() = user_id
    and status = 'visible'
    and hidden_reason is null
    and hidden_at is null
    and hidden_by is null
);


-- 用户可以删除自己的留言，包括被隐藏的留言

drop policy if exists
"Users can delete own messages"
on public.messages;

create policy
"Users can delete own messages"
on public.messages
for delete
to authenticated
using (
    auth.uid() = user_id
);


-- =========================================================
-- 5. 精确设置普通用户权限
-- =========================================================

revoke all privileges
on table public.messages
from public, anon, authenticated;

grant select
on table public.messages
to authenticated;

grant insert (
    user_id,
    content
)
on table public.messages
to authenticated;

grant update (
    content
)
on table public.messages
to authenticated;

grant delete
on table public.messages
to authenticated;


-- =========================================================
-- 6. 公开留言安全视图
--
-- 只输出：
-- 昵称、留言正文、时间、是否编辑、是否本人
-- 不公开邮箱和后台处理信息
-- =========================================================

drop view if exists
public.public_message_cards;

create view
public.public_message_cards
with (
    security_barrier = true
)
as

select
    messages.id
        as message_id,

    profiles.nickname,

    messages.content,

    messages.created_at,

    messages.updated_at,

    (
        messages.updated_at >
        messages.created_at
    )
        as is_edited,

    (
        messages.user_id =
        (select auth.uid())
    )
        as is_owner

from public.messages

inner join public.profiles
    on profiles.id =
       messages.user_id

where messages.status =
      'visible';


-- =========================================================
-- 7. 公开视图权限
-- =========================================================

revoke all privileges
on table public.public_message_cards
from public, anon, authenticated;

grant select
on table public.public_message_cards
to anon, authenticated;

commit;