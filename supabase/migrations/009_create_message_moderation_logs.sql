begin;

-- =========================================================
-- 留言审核日志
--
-- 即使留言被永久删除，日志仍保留：
-- 留言编号、用户编号、昵称快照、正文快照、
-- 处理动作、原因、管理员和处理时间。
-- =========================================================

create table if not exists
public.message_moderation_logs (
    id uuid primary key
        default gen_random_uuid(),

    message_id uuid not null,

    user_id uuid,

    nickname_snapshot text not null,

    content_snapshot text not null,

    action text not null,

    reason text not null,

    admin_id uuid
        references auth.users(id)
        on delete set null,

    created_at timestamptz not null
        default now(),

    constraint
    message_moderation_action_check
        check (
            action in (
                'hide',
                'restore',
                'delete'
            )
        ),

    constraint
    message_moderation_reason_check
        check (
            char_length(
                btrim(reason)
            ) between 1 and 300
        ),

    constraint
    message_moderation_nickname_check
        check (
            char_length(
                btrim(nickname_snapshot)
            ) between 1 and 100
        ),

    constraint
    message_moderation_content_check
        check (
            char_length(
                btrim(content_snapshot)
            ) between 1 and 500
        )
);


-- =========================================================
-- 查询索引
-- =========================================================

create index if not exists
message_moderation_logs_created_idx
on public.message_moderation_logs (
    created_at desc
);

create index if not exists
message_moderation_logs_message_idx
on public.message_moderation_logs (
    message_id,
    created_at desc
);

create index if not exists
message_moderation_logs_admin_idx
on public.message_moderation_logs (
    admin_id,
    created_at desc
);


-- =========================================================
-- 安全设置
--
-- 普通访客和普通登录用户均不能直接读取审核日志。
-- 只有 Edge Function 使用 service_role 访问。
-- =========================================================

alter table
public.message_moderation_logs
enable row level security;

revoke all privileges
on table public.message_moderation_logs
from public, anon, authenticated;

grant select, insert
on table public.message_moderation_logs
to service_role;


-- =========================================================
-- 留言审核函数所需最小权限
-- =========================================================

grant usage
on schema public
to service_role;

grant select, update, delete
on table public.messages
to service_role;

grant select
on table public.profiles
to service_role;

commit;