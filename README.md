# 横眉·鲁迅文化数字展馆

> 《数据技术实训》课程大作业  
> 项目题目：**鲁迅文化专题网站的设计与开发**

“横眉·鲁迅文化数字展馆”是一个以鲁迅文化为主题的综合型专题网站。项目采用民国文化视觉元素与现代响应式网页布局，围绕鲁迅生平、代表作品、人物关系、经典语录、时代背景、作品赏析和历史影像等内容，构建可浏览、可搜索、可收藏、可留言并具备后台管理能力的数字文化展馆。

## 在线访问

- 网站地址：<https://hengmei-luxun.vercel.app>
- GitHub 仓库：<https://github.com/862OvO/hengmei-luxun>

## 项目特点

- 采用真实多页面结构，不依赖前端框架。
- 支持电脑、平板和手机端响应式浏览。
- 公开内容同时提供 Supabase 云端数据和本地 JSON 备用数据。
- 支持中文连续关键词与英文大小写不敏感搜索。
- 支持邮箱注册、邮箱验证、登录、退出和个人资料维护。
- 支持作品、赏析和历史影像收藏。
- 支持公开文化留言板，用户可编辑和删除自己的留言。
- 提供管理员内容管理、图片上传、回收站、用户管理和留言审核。
- 通过 RLS、数据库约束和 Edge Function 实现服务端权限校验。
- 提供自动化项目验收脚本和人工验收检查表。

## 页面结构

| 页面 | 文件 | 主要内容 |
|---|---|---|
| 首页 | `index.html` | 网站入口与专题概览 |
| 鲁迅生平 | `biography.html` | 生平经历与时间线 |
| 代表作品 | `works.html` | 六部代表作品 |
| 人物关系 | `relations.html` | 家庭、师友与文化关系 |
| 经典语录 | `quotes.html` | 主题化语录展示 |
| 时代背景 | `history.html` | 晚清民国社会文化背景 |
| 作品赏析 | `articles.html` | 六篇原创赏析文章 |
| 历史影像 | `gallery.html` | 六组数字影像档案 |
| 内容详情 | `detail.html` | 作品、赏析和影像通用详情页 |
| 全站搜索 | `search.html` | 分类、关键词高亮和相关度排序 |
| 我的收藏 | `favorites.html` | 当前用户收藏内容 |
| 文化留言板 | `messages.html` | 留言发布、编辑、删除和分页 |
| 登录注册 | `auth.html` | 注册、验证、登录和密码重置 |
| 个人中心 | `profile.html` | 账号信息和昵称维护 |
| 管理后台 | `admin.html` | 内容、留言和用户管理 |

## 核心功能

### 内容浏览与搜索

- 三类动态内容：代表作品、作品赏析、历史影像。
- 四类静态专题内容：鲁迅生平、人物关系、经典语录、时代背景。
- 搜索范围覆盖标题、摘要、正文、专属字段和关键词。
- 标题命中优先，其次为摘要、专属字段和正文。
- 相关度相同时按更新时间倒序排列。
- 云端不可用时可读取本地 JSON 备用数据。

### 用户与收藏

- 邮箱和密码注册。
- 邮箱验证后手动登录。
- 登录后返回原访问页面。
- 持久化登录会话。
- 昵称唯一且支持修改。
- 收藏数据以 `user_id + content_id` 唯一约束防止重复收藏。
- 列表页、详情页和收藏页状态同步。

### 文化留言板

- 仅登录用户可以发布留言。
- 纯文本留言，最多 500 字。
- 只公开昵称，不公开邮箱。
- 用户只能编辑和删除自己的留言。
- 最新留言优先，每页 10 条。
- 管理员可隐藏、恢复和永久删除留言。
- 审核日志保留昵称、正文、原因和处理时间快照。

### 管理后台

- 新增、编辑、发布和草稿管理。
- 内容软删除与回收站恢复。
- 上传 JPEG、PNG、WebP 图片。
- 永久删除内容时同步清理收藏记录和 Storage 图片。
- 普通用户临时封禁、永久封禁和解封。
- 账号进入七天待删除状态后仍可恢复。
- 到期后仍需管理员再次确认才能永久删除。
- 管理员身份在 Edge Function 中再次验证。

## 技术栈

| 分类 | 技术 |
|---|---|
| 前端 | HTML5、CSS3、原生 JavaScript ES Modules |
| 开发工具 | Adobe Dreamweaver、Chrome DevTools |
| 数据库 | Supabase PostgreSQL |
| 身份认证 | Supabase Auth |
| 文件存储 | Supabase Storage |
| 服务端逻辑 | Supabase Edge Functions |
| 权限控制 | Row Level Security、数据库约束、服务端角色校验 |
| 版本控制 | Git、GitHub |
| 部署 | Vercel |
| 数据备用 | 本地 JSON |

## 数据设计

### 主要数据表

- `profiles`：用户昵称、角色和账号管理状态。
- `contents`：作品、赏析和影像内容。
- `favorites`：用户收藏关系。
- `messages`：文化留言。
- `message_moderation_logs`：留言审核日志。

### 主要完整性约束

- 昵称不区分大小写唯一。
- 昵称长度为 2 至 20 个字符。
- 收藏关系 `user_id + content_id` 唯一。
- 留言正文限制为 1 至 500 字。
- 内容状态、账号状态和封禁类型均使用检查约束。
- 用户只能读写自己的资料、收藏和留言。

## 安全设计

项目不会在浏览器代码中保存 Supabase `service_role` 密钥。前端只使用允许公开的项目 URL 和 Publishable Key。

高权限操作均通过 Edge Function 执行：

- `delete-content`：永久删除内容、收藏和 Storage 图片。
- `manage-users`：用户封禁、解封、待删除、恢复和永久删除。
- `moderate-messages`：留言隐藏、恢复、永久删除和审核日志记录。

Edge Function 会验证当前登录用户，并再次检查其管理员角色和账号状态。数据库同时启用 RLS、表级权限和约束，降低前端伪造管理请求的风险。

## 项目目录

```text
hengmei-luxun/
├─ assets/
│  ├─ css/                 # 全站及各模块样式
│  ├─ data/                # 本地 JSON 备用内容
│  ├─ images/              # 本地图片资源
│  └─ js/                  # 页面逻辑与 Supabase 服务
├─ docs/
│  ├─ screenshots/         # 项目截图
│  └─ 项目人工验收检查表.md
├─ scripts/
│  ├─ generate-seed-sql.cjs
│  └─ project-audit.cjs
├─ supabase/
│  ├─ functions/           # Edge Functions
│  └─ migrations/          # 数据库迁移
├─ admin.html
├─ auth.html
├─ detail.html
├─ favorites.html
├─ index.html
├─ messages.html
├─ profile.html
├─ search.html
└─ README.md
```

## 本地运行

本项目使用 `fetch`、ES Modules 和 Supabase SDK，不建议直接双击 HTML 文件以 `file://` 方式打开。

推荐使用 Dreamweaver 本地预览服务器：

1. 在 Dreamweaver 中将项目根目录设置为站点目录。
2. 使用“在浏览器中预览”打开 `index.html`。
3. 确认地址以 `http://127.0.0.1` 或 `http://localhost` 开头。

也可以使用任意静态 HTTP 服务器运行项目。

## Supabase 配置

前端连接配置位于：

```text
assets/js/supabase-client.js
```

部署自己的项目时，需要填写：

- Supabase Project URL
- Supabase Publishable Key

请勿把以下内容写入前端文件或提交到公开仓库：

- `service_role` Key
- Secret Key
- 数据库密码
- 管理员测试账号密码

数据库结构应按照 `supabase/migrations/` 中的迁移文件顺序执行，Edge Function 源码位于 `supabase/functions/`。

## 项目验收

运行自动验收：

```bash
node scripts/project-audit.cjs
```

当前自动检查范围包括：

- 15 个核心页面。
- HTML 本地链接和资源引用。
- 三份 JSON 备用数据。
- 全部前端 JavaScript 语法。
- Supabase 迁移文件编号。
- 前端后台密钥风险关键词。

人工功能测试记录位于：

```text
docs/项目人工验收检查表.md
```

## 当前正式内容

| 内容类型 | 数量 |
|---|---:|
| 代表作品 | 6 |
| 作品赏析 | 6 |
| 历史影像 | 6 |
| 合计 | 18 |

## 部署说明

GitHub `main` 分支与 Vercel 项目连接。代码推送后，Vercel 会自动创建新的生产部署。

```bash
git add .
git commit -m "Describe the update"
git push
```

部署完成后，可在 Vercel 的 Deployments 页面确认状态为 `Ready`。

## 浏览器兼容性

主要在以下环境中完成开发与测试：

- Windows 11
- Google Chrome
- Microsoft Edge
- 桌面端、平板端和手机端响应式尺寸

## 后续改进方向

- 补充更多经授权的鲁迅历史图片。
- 扩展人物关系可视化。
- 增加内容访问统计。
- 增加更完整的管理员操作审计。
- 建设适合中国大陆网络环境的静态镜像。
- 对 Supabase SDK 等外部依赖进行本地化处理。

## 说明

本项目仅用于课程学习、技术实践和个人作品集展示。站内鲁迅相关文字与历史资料用于文化研究和教学展示，正式公开使用时应进一步核对资料来源、图片版权与授权状态。
