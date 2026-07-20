begin;

-- =========================================================
-- 留言审核原子操作
--
-- 所有“隐藏 / 恢复 / 永久删除”均在同一数据库事务中完成：
-- 1. 校验管理员状态
-- 2. 锁定留言
-- 3. 修改或删除留言
-- 4. 写入审核日志
--
-- 只有 service_role 可执行，浏览器用户不能直接调用。
-- =========================================================

create or replace function
public.moderate_message_action(
    p_message_id uuid,
    p_action text,
    p_reason text,
    p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_message public.messages%rowtype;
    v_nickname text;
    v_action text;
    v_reason text;
    v_now timestamptz := now();
begin
    v_action := lower(btrim(coalesce(p_action, '')));
    v_reason := btrim(coalesce(p_reason, ''));

    if v_action not in (
        'hide',
        'restore',
        'delete'
    ) then
        raise exception
            '不支持的留言审核操作。';
    end if;

    if char_length(v_reason)
        not between 1 and 300
    then
        raise exception
            '处理原因必须为 1 至 300 个字符。';
    end if;

    if not exists (
        select 1
        from public.profiles
        where id = p_admin_id
          and role = 'admin'
          and account_status = 'active'
    ) then
        raise exception
            '当前账号没有有效的管理员权限。';
    end if;

    select
        messages.*
    into
        v_message
    from public.messages
    where messages.id = p_message_id
    for update;

    if not found then
        raise exception
            '没有找到对应留言。';
    end if;

    select
        profiles.nickname
    into
        v_nickname
    from public.profiles
    where profiles.id =
          v_message.user_id;

    if not found then
        v_nickname :=
            '已注销用户';
    end if;

    if v_action = 'hide' then
        if v_message.status <> 'visible' then
            raise exception
                '只有正常公开的留言才能隐藏。';
        end if;

        update public.messages
        set
            status = 'hidden',
            hidden_reason = v_reason,
            hidden_at = v_now,
            hidden_by = p_admin_id
        where id = p_message_id;

    elsif v_action = 'restore' then
        if v_message.status <> 'hidden' then
            raise exception
                '只有已隐藏的留言才能恢复。';
        end if;

        update public.messages
        set
            status = 'visible',
            hidden_reason = null,
            hidden_at = null,
            hidden_by = null
        where id = p_message_id;

    elsif v_action = 'delete' then
        delete from public.messages
        where id = p_message_id;
    end if;

    insert into
    public.message_moderation_logs (
        message_id,
        user_id,
        nickname_snapshot,
        content_snapshot,
        action,
        reason,
        admin_id,
        created_at
    )
    values (
        v_message.id,
        v_message.user_id,
        v_nickname,
        v_message.content,
        v_action,
        v_reason,
        p_admin_id,
        v_now
    );

    return jsonb_build_object(
        'success', true,
        'messageId', v_message.id,
        'nickname', v_nickname,
        'action', v_action,
        'reason', v_reason,
        'processedAt', v_now
    );
end;
$$;


-- =========================================================
-- 仅后台 service_role 可执行
-- =========================================================

revoke all
on function
public.moderate_message_action(
    uuid,
    text,
    text,
    uuid
)
from public, anon, authenticated;

grant execute
on function
public.moderate_message_action(
    uuid,
    text,
    text,
    uuid
)
to service_role;

commit;
