begin;

-- =========================================================
-- 我的收藏安全卡片视图
--
-- 用途：
-- 1. 只返回当前登录用户自己的收藏
-- 2. 内容下架后仍保留标题、分类、图片等卡片信息
-- 3. 下架内容不返回摘要和正文
-- =========================================================

drop view if exists
public.my_favorite_cards;

create view
public.my_favorite_cards
with (
    security_barrier = true
)
as

select
    favorites.id
        as favorite_id,

    favorites.user_id,

    favorites.content_id,

    favorites.created_at
        as favorited_at,

    contents.content_type,

    contents.slug,

    contents.title,

    case
        when contents.status = 'published'
         and contents.deleted_at is null
            then contents.summary
        else ''
    end
        as summary,

    contents.image_path,

    contents.metadata,

    contents.status
        as content_status,

    contents.deleted_at,

    (
        contents.status = 'published'
        and contents.deleted_at is null
    )
        as is_available

from public.favorites
inner join public.contents
    on contents.id =
       favorites.content_id

where favorites.user_id =
      (select auth.uid());


-- =========================================================
-- 访问权限
-- =========================================================

revoke all privileges
on table public.my_favorite_cards
from public;

revoke all privileges
on table public.my_favorite_cards
from anon;

grant select
on table public.my_favorite_cards
to authenticated;

commit;