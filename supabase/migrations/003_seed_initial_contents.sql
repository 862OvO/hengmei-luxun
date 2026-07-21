begin;

-- 本文件由 scripts/generate-seed-sql.cjs 自动生成
-- 数据来源：assets/data/*.json
-- 内容总数：18

with seed_data as (
    select *
    from jsonb_to_recordset(
$seed_data$
[
  {
    "content_type": "works",
    "slug": "kuangren-riji",
    "title": "狂人日记",
    "summary": "作品以一位被视为“患病者”的日记为中心，通过“吃人”的象征、双重叙述与不可靠视角，审视礼教秩序、群体冷漠和个体觉醒的代价。",
    "body": "## 作品导读\n\n《狂人日记》写于新文化运动兴起之际，1918年5月刊于《新青年》第四卷第五号，并首次使用“鲁迅”这一笔名。它常被视为中国现代白话小说的重要开端，但价值并不只在“第一篇”这一标签。鲁迅借一个被家人和乡人认作“患病”的人的眼睛，重新审视日常生活、伦理秩序和历史记忆：越是被社会判定为荒唐的声音，越可能触及多数人不愿承认的事实。读者因此同时面对两种判断——狂人的恐惧是否源于病症，以及他关于“吃人”的发现是否揭示了真实的社会结构。[1][4]\n\n## 创作与发表背景\n\n鲁迅当时在北京教育部任职，并长期居住在绍兴会馆。钱玄同等《新青年》同人劝他重新写作，后来被概括为《〈呐喊〉自序》中关于“铁屋子”的对话。鲁迅并不确信少数清醒者能否改变沉睡的人群，却也承认不能抹杀尚未发生的希望，于是写下《狂人日记》，此后陆续创作了收入《呐喊》的多篇小说。[2] 作品发表于1918年5月，其文言小序模拟整理病历的客观口吻，十三则日记则主要采用白话，由两种语言和两种观察立场共同构成文本。[1][4] 1923年，《狂人日记》收入新潮社初版《呐喊》，由单篇杂志作品进入鲁迅第一部小说集的整体结构。[5]\n\n## 内容概述\n\n小说开头由一位文言叙述者说明：昔日友人的弟弟曾患“迫害狂”，病愈后外出候补，留下两册日记。正文随即进入狂人的第一人称世界。他从月光、犬吠、路人的目光和孩子的议论中感到危险，继而怀疑赵贵翁、医生、母亲乃至自己的大哥都参与了“吃人”的秩序。随着阅读历史和回忆往事，他把零散恐惧组织成一个判断：表面写着仁义道德的历史，字缝里却隐藏着“吃人”。到结尾，他又怀疑自己也可能参与过这种秩序。日记没有给出胜利，而以对下一代的呼喊结束。文言小序却说狂人已经“早愈”，并去候补做官；这种看似恢复正常的结局，使读者反过来追问：究竟谁才是真正清醒的人？\n\n> 凡事总须研究，才会明白。\n> ——《狂人日记》\n\n## 主要人物与叙述视角\n\n狂人既是故事人物，也是整篇小说的感知中心。他高度敏感、不断联想，叙述显然带有迫害妄想的特征，因此读者不能把每个细节都当作客观事实；但他的“不可靠”并不等于他的判断毫无意义。恰恰因为他脱离了习以为常的解释方式，普通人的目光、劝说和沉默才显出压迫性。大哥代表家族权威和伦理秩序，赵贵翁、医生、街上的人以及围观的孩子形成层层扩散的社会环境。他们未必真要伤害狂人，却共同维护不容质疑的生活方式。文言小序的整理者则站在所谓正常社会一边，以冷静分类的方式把狂人的语言变成“病例”。小说由此形成双重叙述：表层是一个病人的日记，深层则是被判为病态的个人对正常秩序的审问。\n\n## 核心主题\n\n作品最著名的“吃人”并非单一事件，而是一种象征结构。它指向以仁义道德为名、实际牺牲个人尊严的伦理关系，也指向人们在服从和围观中成为秩序的一部分。狂人最初把自己看成受害者，后来却想到自己可能吃过妹妹的肉，这一转折使批判不再停留于“坏人迫害好人”，而进入更困难的自我反省：身处旧秩序的人，即使并无明确恶意，也可能继承并重复伤害。[1]\n\n- “吃人”揭示礼教话语与现实伤害之间的裂缝。\n- 狂人的觉醒带来清醒，也带来无法与多数人沟通的孤独。\n- 从控诉他人转向怀疑自己，使作品具有持续的伦理压力。\n- 对孩子的呼喊把希望交给尚未完全被旧秩序塑造的未来。\n\n> 救救孩子……\n> ——《狂人日记》\n\n## 艺术特色\n\n小说首先以“格式的特别”制造阅读张力。文言小序像档案、病案或出版说明，努力建立可靠的外部框架；白话日记则破碎、跳跃、重复，贴近人物不断加速的心理活动。两种文体并置，使“正常”与“疯狂”不再是简单答案，而成为需要读者判断的问题。[4] 其次，作品大量使用日常细节的陌生化：月光、狗、眼神、看病和劝食本来都很普通，经狂人的意识重新组合后，却显露出威胁。再次，“吃人”把历史、家庭和个人经验联结起来，既指向具体压迫，也容纳文化反思。小说还使用反讽：狂人被宣布“病愈”并重新进入仕途，看似是秩序恢复，实际上可能意味着批判声音被重新收编。短促句式、疑问、重复和突然转折共同形成紧张节奏，使思想判断不是抽象议论，而成为一种逼近读者的精神体验。\n\n## 文学史影响\n\n《狂人日记》的发表把白话文、现代小说形式和社会批判集中在一篇短篇作品中，成为新文学早期极具标志性的创作成果。它不是简单把文言改成白话，而是改变了小说观察人的方式：人物的心理、叙述的可靠性以及读者的判断都成为作品结构的一部分。鲁迅后来说明，自己写小说并非为了进入传统意义上的“文苑”，而是希望利用文学的力量改良社会。[3] 这一创作立场也解释了作品为何既重视形式实验，又始终把人的处境放在中心。今天重读《狂人日记》，重要的不只是辨认“吃人”对应哪一种历史制度，更是检查我们是否在熟悉的语言、规则和群体判断中忽略了具体的人。\n\n## 参考资料\n\n[1] 鲁迅：《狂人日记》（1918年《新青年》版本），维基文库。https://zh.wikisource.org/zh-hans/狂人日记_(1918年本)\n\n[2] 鲁迅：《呐喊·自序》，维基文库。https://zh.wikisource.org/zh-hans/呐喊\n\n[3] 鲁迅：《我怎么做起小说来？》，维基文库。https://zh.wikisource.org/zh-hans/我怎麼做起小說來？\n\n[4] 姜异新：《重读〈狂人日记〉：约稿·创作·发表·冷遇》，中国作家网，2022年3月30日。https://www.chinawriter.com.cn/n1/2022/0330/c419384-32387494.html\n\n[5] 唐文一：《鲁迅的处女作小说集〈呐喊〉》，中国作家网，2021年9月22日。https://www.chinawriter.com.cn/n1/2021/0922/c419387-32233145.html",
    "image_path": "assets/images/works/kuangren-riji-cover.svg",
    "metadata": {
      "year": "1918",
      "genre": "短篇小说",
      "collection": "《呐喊》",
      "first_published": "《新青年》第四卷第五号（1918年5月）",
      "creation_place": "北京",
      "keywords": [
        "吃人",
        "礼教",
        "觉醒",
        "不可靠叙述",
        "救救孩子"
      ],
      "image_type": "original",
      "image_caption": "《狂人日记》本站原创视觉封面",
      "image_creator": "横眉·鲁迅文化数字展馆",
      "image_date": "2026",
      "image_source": "本站原创",
      "image_license": "本站原创，仅用于本课程项目与项目展示",
      "image_alt": "米白色民国书刊风格的《狂人日记》原创文字封面"
    },
    "status": "published",
    "sort_order": 10
  },
  {
    "content_type": "works",
    "slug": "aq-zhengzhuan",
    "title": "阿Q正传",
    "summary": "作品以未庄雇农阿Q的人生遭遇为中心，塑造了具有复杂社会意义的“精神胜利法”形象。",
    "body": "《阿Q正传》通过阿Q在未庄的生活、受辱、革命幻想和最终被处决的经历，描写辛亥革命前后的社会环境。阿Q常以自我安慰化解现实失败，这种心理后来被概括为“精神胜利法”。作品既批判人物自身的弱点，也揭示造成其悲剧的社会结构与冷漠群体。",
    "image_path": null,
    "metadata": {
      "year": "1921—1922",
      "genre": "中篇小说",
      "collection": "《呐喊》",
      "first_published": "《晨报副刊》",
      "keywords": [
        "阿Q",
        "精神胜利法",
        "未庄",
        "辛亥革命"
      ]
    },
    "status": "published",
    "sort_order": 20
  },
  {
    "content_type": "works",
    "slug": "guxiang",
    "title": "故乡",
    "summary": "小说通过“我”回乡搬家的见闻，呈现记忆中的故乡与现实故乡之间的巨大落差。",
    "body": "《故乡》围绕“我”返回故乡、处理老屋并再次离开的过程展开。少年闰土在记忆中活泼勇敢，成年后却因生活重压而变得迟钝、拘谨。作品通过人物关系与环境变化，描写乡村社会的贫困和隔膜，并在结尾借“路”的意象表达对新生活的期待。",
    "image_path": null,
    "metadata": {
      "year": "1921",
      "genre": "短篇小说",
      "collection": "《呐喊》",
      "first_published": "《新青年》第九卷第一号",
      "keywords": [
        "故乡",
        "闰土",
        "隔膜",
        "希望",
        "路"
      ]
    },
    "status": "published",
    "sort_order": 30
  },
  {
    "content_type": "works",
    "slug": "zhufu",
    "title": "祝福",
    "summary": "小说以祥林嫂的悲剧命运为中心，揭示封建礼教、迷信观念与社会冷漠对女性的多重压迫。",
    "body": "《祝福》的故事发生在年终祭祀氛围浓厚的鲁镇。祥林嫂经历丧夫、被迫改嫁、再次丧夫和失子后，逐渐被周围社会排斥。她试图通过捐门槛摆脱罪恶感，却仍无法重新获得尊严。作品以热闹的“祝福”仪式反衬人物的死亡与孤独。",
    "image_path": null,
    "metadata": {
      "year": "1924",
      "genre": "短篇小说",
      "collection": "《彷徨》",
      "first_published": "《东方杂志》",
      "keywords": [
        "祥林嫂",
        "鲁镇",
        "礼教",
        "女性命运",
        "社会冷漠"
      ]
    },
    "status": "published",
    "sort_order": 40
  },
  {
    "content_type": "works",
    "slug": "zhaohua-xishi",
    "title": "朝花夕拾",
    "summary": "这部回忆性散文集以童年、求学和青年经历为线索，记录鲁迅生命中的人物、教育与社会记忆。",
    "body": "《朝花夕拾》收录十篇回忆性散文。作品涉及长妈妈、藤野先生、范爱农等人物，也写到百草园、三味书屋、求学经历和家庭生活。文章在温情回忆中保持批判意识，将个人成长、社会风俗和时代经验联系起来。",
    "image_path": null,
    "metadata": {
      "year": "1928",
      "genre": "回忆性散文集",
      "collection": "单行本",
      "original_title": "旧事重提",
      "article_count": 10,
      "keywords": [
        "回忆",
        "童年",
        "藤野先生",
        "百草园",
        "旧事重提"
      ]
    },
    "status": "published",
    "sort_order": 50
  },
  {
    "content_type": "works",
    "slug": "yecao",
    "title": "野草",
    "summary": "散文诗集以象征、梦境和独白等形式，表达鲁迅对生命、黑暗、希望与抗争的深层思考。",
    "body": "《野草》由多篇散文诗组成，包括《秋夜》《雪》《风筝》《好的故事》《过客》等。作品常运用梦境、象征和内心独白，构造幽暗而富有张力的精神世界。它既表现孤独、怀疑和死亡意识，也保存着持续反抗黑暗的意志。",
    "image_path": null,
    "metadata": {
      "year": "1927",
      "genre": "散文诗集",
      "collection": "单行本",
      "article_count": 23,
      "keywords": [
        "散文诗",
        "象征",
        "梦境",
        "黑暗",
        "抗争"
      ]
    },
    "status": "published",
    "sort_order": 60
  },
  {
    "content_type": "articles",
    "slug": "kuangren-riji-lijiao-pipan",
    "title": "《狂人日记》：从“吃人”意象看礼教批判",
    "summary": "作品将“吃人”塑造成贯穿全文的核心意象，通过狂人的恐惧和怀疑，揭示传统伦理秩序对个体生命的压迫。",
    "body": "《狂人日记》没有把批判停留在某个具体人物身上，而是让狂人从历史、家庭和日常交往中不断发现“吃人”的痕迹。“吃人”因此具有象征意义，指向一种以道德名义限制个体、维护等级秩序的社会机制。\n\n狂人的叙述带有强烈的主观色彩，他的判断在常人看来近乎疯狂。但正是这种被视为“异常”的目光，发现了习以为常的社会规则中隐藏的问题。作品结尾的“救救孩子”把批判转向未来，表达阻断旧秩序延续的愿望。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "狂人日记",
      "analysis_focus": "意象与礼教批判",
      "reading_time": "约4分钟",
      "keywords": [
        "吃人意象",
        "封建礼教",
        "狂人视角",
        "救救孩子"
      ]
    },
    "status": "published",
    "sort_order": 10
  },
  {
    "content_type": "articles",
    "slug": "aq-jingshen-shenglifa",
    "title": "《阿Q正传》：“精神胜利法”的形成与悲剧",
    "summary": "阿Q不断通过自我安慰重新解释现实失败，“精神胜利法”既表现人物性格，也反映其缺乏改变现实能力的社会处境。",
    "body": "阿Q在受到欺凌和失败后，常常通过改变解释方式维护自尊。他可能把失败说成胜利，也可能借欺负更弱者转移痛苦。这种心理方式使他暂时逃避了现实，却也让他难以真正认识自己的处境。\n\n作品并没有把阿Q的悲剧简单归结为个人缺点。未庄的等级关系、围观者的冷漠以及革命过程中的混乱，共同构成了人物命运的社会背景。阿Q既是被批判的对象，也是需要被理解的受害者。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "阿Q正传",
      "analysis_focus": "人物心理与社会环境",
      "reading_time": "约4分钟",
      "keywords": [
        "精神胜利法",
        "阿Q",
        "人物形象",
        "社会悲剧"
      ]
    },
    "status": "published",
    "sort_order": 20
  },
  {
    "content_type": "articles",
    "slug": "guxiang-lu-yixiang",
    "title": "《故乡》：“路”的意象与希望的生成",
    "summary": "小说在故乡衰败和人际隔膜中保留了对未来的期待，并通过结尾的“路”表达希望需要实践和创造。",
    "body": "《故乡》中的现实充满落差。记忆中的闰土聪明活泼，成年闰土却在贫困和等级观念的压力下变得拘谨。人物之间原本自然的关系被身份和生活重担分隔，故乡也由明亮的记忆变成萧索的现实。\n\n作品结尾没有给出已经实现的理想生活，而是借“路”的比喻说明希望并非天然存在。路来自人的行走，意味着新的关系和生活需要人们主动创造。这使小说在沉重的现实描写之外，仍然保留开放的未来方向。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "故乡",
      "analysis_focus": "环境对比与路的意象",
      "reading_time": "约4分钟",
      "keywords": [
        "闰土",
        "故乡",
        "隔膜",
        "希望",
        "路的意象"
      ]
    },
    "status": "published",
    "sort_order": 30
  },
  {
    "content_type": "articles",
    "slug": "zhufu-xianglinsao-beiju",
    "title": "《祝福》：祥林嫂悲剧中的多重压迫",
    "summary": "祥林嫂的死亡并非由单一事件造成，而是经济困境、礼教观念、迷信压力和群体冷漠共同作用的结果。",
    "body": "祥林嫂始终试图通过劳动维持生活，但她无法掌握自己的婚姻和命运。丧夫、被迫改嫁、失子等经历不断削弱她的生存基础，而社会又用所谓贞节和罪孽观念评价她，使受害者承担道德压力。\n\n鲁镇的人们最初对她的遭遇感到新奇，后来逐渐厌烦。她的痛苦变成可供重复讲述的故事，却很少得到真正帮助。小说以热闹的年终“祝福”反衬祥林嫂的死亡，突出仪式繁盛与人的冷漠之间的矛盾。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "祝福",
      "analysis_focus": "女性命运与社会冷漠",
      "reading_time": "约5分钟",
      "keywords": [
        "祥林嫂",
        "女性命运",
        "封建礼教",
        "迷信",
        "社会冷漠"
      ]
    },
    "status": "published",
    "sort_order": 40
  },
  {
    "content_type": "articles",
    "slug": "zhaohua-xishi-jiyi-yupipan",
    "title": "《朝花夕拾》：温情记忆中的批判意识",
    "summary": "散文集以成年人的视角回望童年与青年经历，在温情叙述中呈现教育、家庭和社会风俗的问题。",
    "body": "《朝花夕拾》中的回忆并不是对过去的简单美化。百草园、长妈妈和藤野先生等内容带有真切温情，但作品同时记录旧式教育的压抑、社会偏见以及人与人之间的复杂关系。\n\n“朝花夕拾”这一名称意味着在后来的人生阶段重新整理早年的经验。作者既保留儿童视角中的好奇，也加入成年后的反思。个人记忆因此与时代环境相连接，使作品同时具有文学性、历史感和批判力量。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "朝花夕拾",
      "analysis_focus": "回忆叙事与批判意识",
      "reading_time": "约4分钟",
      "keywords": [
        "回忆散文",
        "童年",
        "教育",
        "藤野先生",
        "批判意识"
      ]
    },
    "status": "published",
    "sort_order": 50
  },
  {
    "content_type": "articles",
    "slug": "yecao-xiangzheng-shijie",
    "title": "《野草》：象征世界中的黑暗与抗争",
    "summary": "《野草》通过梦境、独白和象征构造复杂的精神空间，在怀疑、孤独与死亡意识中保持持续抗争的力量。",
    "body": "《野草》的许多篇章并不采用完整的现实故事，而是通过枣树、雪、过客、影子和梦境等形象表达难以直接说明的精神体验。这些意象具有开放性，不同读者可以从中感受到孤独、压抑、希望或反抗。\n\n作品中的抗争并不总是表现为明确胜利。人物常常面对无法确定的道路和强大的黑暗，却仍然选择前行。正因如此，《野草》的力量来自清醒地认识困境之后依然不停止行动，而不是用轻易的乐观掩盖现实。",
    "image_path": null,
    "metadata": {
      "author": "本站编辑",
      "related_work": "野草",
      "analysis_focus": "象征、梦境与精神抗争",
      "reading_time": "约5分钟",
      "keywords": [
        "散文诗",
        "象征",
        "梦境",
        "黑暗",
        "抗争"
      ]
    },
    "status": "published",
    "sort_order": 60
  },
  {
    "content_type": "gallery",
    "slug": "luxun-portrait",
    "title": "鲁迅肖像",
    "summary": "鲁迅肖像资料条目，用于呈现其人物形象与文化记忆。",
    "body": "本条目用于展示鲁迅肖像资料。正式发布历史图片时，应补充拍摄时间、摄影者、馆藏机构、原始来源和授权信息，避免使用来源不明的网络图片。",
    "image_path": "assets/images/gallery/luxun-portrait-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "待核对",
      "category": "人物肖像",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "鲁迅肖像资料图占位图",
      "keywords": [
        "鲁迅",
        "肖像",
        "人物形象",
        "历史影像"
      ]
    },
    "status": "published",
    "sort_order": 10
  },
  {
    "content_type": "gallery",
    "slug": "shaoxing-residence",
    "title": "绍兴故居与成长环境",
    "summary": "展示与鲁迅早年生活、家庭记忆和绍兴文化环境相关的历史建筑资料。",
    "body": "本条目用于整理鲁迅在绍兴生活环境相关的影像资料。后续应采用具有明确来源和使用许可的照片，并对具体建筑名称、拍摄年代和地点进行核对。",
    "image_path": "assets/images/gallery/shaoxing-residence-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "浙江绍兴",
      "category": "故居建筑",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "绍兴故居与成长环境资料图占位图",
      "keywords": [
        "绍兴",
        "故居",
        "成长环境",
        "百草园",
        "三味书屋"
      ]
    },
    "status": "published",
    "sort_order": 20
  },
  {
    "content_type": "gallery",
    "slug": "japan-study-period",
    "title": "日本留学时期",
    "summary": "整理鲁迅留学日本期间的求学经历、校园环境和相关人物影像资料。",
    "body": "本条目用于呈现鲁迅日本留学时期的相关资料。后续加入真实影像时，需要分别核对学校名称、人物身份、拍摄时间及资料收藏单位。",
    "image_path": "assets/images/gallery/japan-study-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "日本",
      "category": "求学经历",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "鲁迅日本留学时期资料图占位图",
      "keywords": [
        "日本留学",
        "求学",
        "仙台",
        "藤野先生"
      ]
    },
    "status": "published",
    "sort_order": 30
  },
  {
    "content_type": "gallery",
    "slug": "beijing-residence",
    "title": "北京时期的生活与写作",
    "summary": "展示鲁迅在北京工作、生活和从事文学活动期间的相关场所与历史资料。",
    "body": "本条目用于整理鲁迅北京时期的生活和写作影像。正式使用图片前，应核对住所、工作机构、拍摄年代及图片来源，避免将不同时期的建筑混用。",
    "image_path": "assets/images/gallery/beijing-residence-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "北京",
      "category": "生活场所",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "鲁迅北京时期生活与写作资料图占位图",
      "keywords": [
        "北京",
        "写作",
        "生活场所",
        "文学活动"
      ]
    },
    "status": "published",
    "sort_order": 40
  },
  {
    "content_type": "gallery",
    "slug": "manuscript-and-publication",
    "title": "手稿与早期出版物",
    "summary": "展示鲁迅作品手稿、书刊封面和早期出版物等文献资料。",
    "body": "本条目用于展示作品手稿、杂志版面和早期单行本等文献影像。后续应记录文献名称、版本、出版时间、收藏机构和图片授权信息。",
    "image_path": "assets/images/gallery/manuscript-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "待核对",
      "category": "文献手稿",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "鲁迅手稿与早期出版物资料图占位图",
      "keywords": [
        "手稿",
        "出版物",
        "书刊",
        "文献",
        "版本"
      ]
    },
    "status": "published",
    "sort_order": 50
  },
  {
    "content_type": "gallery",
    "slug": "memorial-and-legacy",
    "title": "纪念活动与文化传承",
    "summary": "整理鲁迅纪念场馆、纪念活动和文化传播相关的历史与当代影像。",
    "body": "本条目用于呈现鲁迅文化遗产的保存与传播。正式加入图片时，应区分历史照片与当代纪念场馆照片，并注明拍摄者、时间、地点和使用许可。",
    "image_path": "assets/images/gallery/memorial-placeholder.svg",
    "metadata": {
      "display_date": "待核对",
      "location": "待核对",
      "category": "纪念传承",
      "source_name": "待补充",
      "source_url": "",
      "license": "待核对",
      "alt": "鲁迅纪念活动与文化传承资料图占位图",
      "keywords": [
        "纪念",
        "博物馆",
        "文化传承",
        "鲁迅研究"
      ]
    },
    "status": "published",
    "sort_order": 60
  }
]
$seed_data$::jsonb
    ) as item (
        content_type text,
        slug text,
        title text,
        summary text,
        body text,
        image_path text,
        metadata jsonb,
        status text,
        sort_order integer
    )
)

insert into public.contents as existing (
    content_type,
    slug,
    title,
    summary,
    body,
    image_path,
    metadata,
    status,
    sort_order,
    published_at
)

select
    content_type,
    slug,
    title,
    summary,
    body,
    image_path,
    metadata,
    status,
    sort_order,
    case
        when status = 'published'
            then now()
        else null
    end
from seed_data

on conflict (
    content_type,
    slug
)

do update set
    title = excluded.title,
    summary = excluded.summary,
    body = excluded.body,
    image_path = excluded.image_path,
    metadata = excluded.metadata,
    status = excluded.status,
    sort_order = excluded.sort_order,

    published_at = case
        when excluded.status = 'published'
            then coalesce(
                existing.published_at,
                excluded.published_at
            )
        else null
    end,

    deleted_at = null,
    updated_at = now();

commit;
