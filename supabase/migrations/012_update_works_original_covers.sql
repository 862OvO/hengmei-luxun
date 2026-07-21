begin;

-- 六部代表作品原创封面批量接入
-- 仅更新 image_path 与图片授权元数据，不修改正文和摘要。

do $migration$
declare
    v_updated integer;
begin
    with cover_data as (
        select *
        from jsonb_to_recordset(
$cover_data$
[
  {
    "slug": "kuangren-riji",
    "image_path": "assets/images/works/kuangren-riji-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《狂人日记》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《狂人日记》原创封面，含冷月、凝视眼睛与手稿意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "冷月、凝视眼睛与手稿意象",
      "image_accent": "暗红与炭灰",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  },
  {
    "slug": "aq-zhengzhuan",
    "image_path": "assets/images/works/a-q-zhengzhuan-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《阿Q正传》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《阿Q正传》原创封面，含未庄牌楼与辫影意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "未庄牌楼与辫影意象",
      "image_accent": "暗红与赭黄",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  },
  {
    "slug": "guxiang",
    "image_path": "assets/images/works/guxiang-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《故乡》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《故乡》原创封面，含月夜、瓜田与远帆意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "月夜、瓜田与远帆意象",
      "image_accent": "暗红与蓝灰",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  },
  {
    "slug": "zhufu",
    "image_path": "assets/images/works/zhufu-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《祝福》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《祝福》原创封面，含雪夜、门神与香火意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "雪夜、门神与香火意象",
      "image_accent": "暗红与冷灰",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  },
  {
    "slug": "zhaohua-xishi",
    "image_path": "assets/images/works/zhaohua-xishi-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《朝花夕拾》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《朝花夕拾》原创封面，含花枝、旧书与晨光意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "花枝、旧书与晨光意象",
      "image_accent": "暗红与橄榄金",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  },
  {
    "slug": "yecao",
    "image_path": "assets/images/works/yecao-cover.webp",
    "metadata": {
      "image_type": "original",
      "image_caption": "《野草》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《野草》原创封面，含枣树、暗夜与星点意象",
      "image_format": "WebP",
      "image_dimensions": "1086 × 1448",
      "image_motif": "枣树、暗夜与星点意象",
      "image_accent": "暗红与深青灰",
      "image_process": "生成式图像工具辅助制作，由本站选定、整理并转换为网站格式"
    }
  }
]
$cover_data$::jsonb
        ) as item (
            slug text,
            image_path text,
            metadata jsonb
        )
    ),
    updated_rows as (
        update public.contents as target
        set
            image_path = cover_data.image_path,
            metadata =
                coalesce(target.metadata, '{}'::jsonb)
                ||
                coalesce(cover_data.metadata, '{}'::jsonb),
            updated_at = now()
        from cover_data
        where target.content_type = 'works'
          and target.slug = cover_data.slug
          and target.deleted_at is null
        returning target.slug
    )
    select count(*)
    into v_updated
    from updated_rows;

    if v_updated <> 6 then
        raise exception
            'Expected exactly six active works rows, updated %',
            v_updated;
    end if;
end
$migration$;

commit;
