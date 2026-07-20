begin;

-- =========================================================
-- 用户管理状态字段
--
-- account_status:
-- active             正常账号
-- banned             封禁账号
-- pending_deletion   待删除账号
-- =========================================================

alter table public.profiles
add column if not exists
account_status text not null
default 'active';

alter table public.profiles
add column if not exists
ban_type text;

alter table public.profiles
add column if not exists
ban_reason text;

alter table public.profiles
add column if not exists
banned_at timestamptz;

alter table public.profiles
add column if not exists
banned_until timestamptz;

alter table public.profiles
add column if not exists
banned_by uuid
references auth.users(id)
on delete set null;

alter table public.profiles
add column if not exists
deletion_requested_at timestamptz;

alter table public.profiles
add column if not exists
deletion_effective_after timestamptz;

alter table public.profiles
add column if not exists
deletion_reason text;

alter table public.profiles
add column if not exists
deletion_requested_by uuid
references auth.users(id)
on delete set null;


-- =========================================================
-- 字段状态约束
-- =========================================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname =
              'profiles_account_status_check'
          and conrelid =
              'public.profiles'::regclass
    ) then
        alter table public.profiles
        add constraint
        profiles_account_status_check
        check (
            account_status in (
                'active',
                'banned',
                'pending_deletion'
            )
        );
    end if;
end;
$$;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname =
              'profiles_ban_type_check'
          and conrelid =
              'public.profiles'::regclass
    ) then
        alter table public.profiles
        add constraint
        profiles_ban_type_check
        check (
            ban_type is null
            or ban_type in (
                'temporary',
                'permanent'
            )
        );
    end if;
end;
$$;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname =
              'profiles_account_state_consistency_check'
          and conrelid =
              'public.profiles'::regclass
    ) then
        alter table public.profiles
        add constraint
        profiles_account_state_consistency_check
        check (
            (
                account_status = 'active'

                and ban_type is null
                and ban_reason is null
                and banned_at is null
                and banned_until is null
                and banned_by is null

                and deletion_requested_at
                    is null
                and deletion_effective_after
                    is null
                and deletion_reason
                    is null
                and deletion_requested_by
                    is null
            )

            or

            (
                account_status = 'banned'

                and ban_type in (
                    'temporary',
                    'permanent'
                )

                and ban_reason is not null
                and char_length(
                    btrim(ban_reason)
                ) between 1 and 300

                and banned_at is not null
                and banned_by is not null

                and (
                    (
                        ban_type = 'temporary'
                        and banned_until
                            is not null
                        and banned_until >
                            banned_at
                    )

                    or

                    (
                        ban_type = 'permanent'
                        and banned_until
                            is null
                    )
                )

                and deletion_requested_at
                    is null
                and deletion_effective_after
                    is null
                and deletion_reason
                    is null
                and deletion_requested_by
                    is null
            )

            or

            (
                account_status =
                    'pending_deletion'

                and ban_type is null
                and ban_reason is null
                and banned_at is null
                and banned_until is null
                and banned_by is null

                and deletion_requested_at
                    is not null
                and deletion_effective_after
                    is not null

                and deletion_effective_after
                    >=
                    deletion_requested_at
                    + interval '7 days'

                and deletion_reason
                    is not null

                and char_length(
                    btrim(deletion_reason)
                ) between 1 and 300

                and deletion_requested_by
                    is not null
            )
        );
    end if;
end;
$$;


-- =========================================================
-- 后台筛选索引
-- =========================================================

create index if not exists
profiles_account_status_idx
on public.profiles (
    account_status,
    created_at desc
);

create index if not exists
profiles_banned_until_idx
on public.profiles (
    banned_until
)
where account_status = 'banned';

create index if not exists
profiles_deletion_effective_after_idx
on public.profiles (
    deletion_effective_after
)
where account_status =
      'pending_deletion';


-- =========================================================
-- Edge Function 最小权限
--
-- service_role 需要读取及更新用户管理字段。
-- 不向 anon 或 authenticated 增加管理权限。
-- =========================================================

grant usage
on schema public
to service_role;

grant select, update
on table public.profiles
to service_role;

commit;