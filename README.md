# AI 资源站（Next.js App Router）

基于 Next.js + TypeScript + Tailwind 的资源站点原型，覆盖 Prompt / MCP / Skill / Tutorial 四类内容，包含：

- 前台列表/详情渲染（mock 数据驱动）
- 普通用户手机号+验证码登录/注册（测试验证码固定 `123456`）
- Authoring（新建/编辑/提交）本地工作区
- 社交互动（投票/收藏/评论）本地持久化
- 后台审核控制台 + 审计日志本地落库
- Django + DRF 后端（首期 API，支持内容读取与后台管理相关接口）
- 第 7 步发布级收尾：统一 UI、加载/错误/空态、SEO、响应式与文档化

> 冲突口径唯一真相源：`docs/DECISIONS.md`

## 技术栈

- Next.js 16（App Router）
- TypeScript
- Tailwind CSS（`@import "tailwindcss"`）
- Django 4.2 LTS + DRF（`backend/`，可选启用）

## 本地启动

如果你有全局 `pnpm`：

```bash
pnpm install
pnpm dev
```

如果没有全局 `pnpm`：

```bash
NPM_CONFIG_CACHE=.npm-cache npx pnpm install
NPM_CONFIG_CACHE=.npm-cache npx pnpm dev
```

默认地址：`http://localhost:3000`

### 后端启动（Django + DRF）

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_local_data
python manage.py runserver 127.0.0.1:8000
```

手机号登录/注册联调说明（当前为测试模式）：
- 验证码固定为 `123456`（仅接口占位，未接入真实短信网关）
- 仅当 `NEXT_PUBLIC_API_MODE=http` 时，注册用户会写入 Django `auth.User`，可在管理后台查看

启用前端 HTTP 模式（对接后端）：

```bash
NEXT_PUBLIC_API_MODE=http NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 pnpm dev
```

可选：指定前端“管理登录”按钮跳转地址（默认 `http://127.0.0.1:8000/admin/`）：

```bash
NEXT_PUBLIC_DJANGO_ADMIN_URL=http://127.0.0.1:8000/admin/
```

构建检查：

```bash
NPM_CONFIG_CACHE=.npm-cache npx pnpm build
NPM_CONFIG_CACHE=.npm-cache npx pnpm lint
NPM_CONFIG_CACHE=.npm-cache npx pnpm exec tsc --noEmit
```

## 目录结构

```txt
app/                    # App Router 页面与路由段
components/
  ui/                   # 轻量统一 UI（Button/Input/Select/...）
  feedback/             # EmptyState/Skeleton/InlineNotice
  layout/               # PageShell/SectionCard/SideNav/StatusBanner
  resource/             # ResourceCard/ResourceList/FilterBar
  social/               # Vote/Favorite/Share/Comment
  admin/                # 审核队列/动作/审计面板
  forms/                # 发布/编辑表单
lib/
  api/                  # 对外 API 门面 + mock/social/authoring/admin_review/audit/admin_console
  client/               # localStorage 读写封装（SSR 安全，含后台管理状态）
backend/                # Django + DRF 后端工程（SQLite + seed + API）
data/                   # 静态 mock 数据
  prompts.json
  mcps.json
  skills.json
  tutorials.json
  taxonomies.json
types/                  # DTO/ViewModel/adapter/authoring/social/audit 类型
docs/                   # 需求文档、冲突决策、路由清单、发布检查
public/                 # robots.txt / sitemap.xml
```

## 数据与 API 约定

### 种子数据导入（docs/数据源信息.md）

运行：

```bash
pnpm import:seed
```

脚本：`scripts/import_seed_from_docs.js`  
数据源：`docs/数据源信息.md`

导入规则（可重复执行，合并去重）：

- 解析引用式链接：`[GitHub][n]` + 底部 `[n]: URL`
- 清洗 URL：去除 `utm_*` 参数，保留 canonical URL
- stars 解析：
  - `79.8k -> 79800`
  - `28k -> 28000`
  - 同时保留原串到 `metrics.github_stars_text`
- repo 解析：
  - `owner/repo（备注）` 拆成 `repo=owner/repo`
  - 括号内容写入 `source_meta.note`
- 去重键优先级：
  1. `source_meta.repo`
  2. `url/repo_url`
  3. `title`
- Prompt 自动加类型标签：
  - `prompt_image` / `prompt_video` / `prompt_text`
- taxonomies 自动补齐 tags：
  - `prompt_image` / `prompt_video` / `prompt_text` / `github`

占位字段说明（按 DECISIONS 保持现口径）：

- MCP `how_to_use.*` 三段文本：种子数据缺失时写占位文案
- Skill `zip_asset_id`：种子数据无压缩包时写 `"TODO"`
- Skill `install_commands[]`：默认 `npx skills add owner/repo`（不保证仓库真实支持）
- Prompt `prompt_text`：写“仓库型提示词资源”占位正文，附仓库链接

### 内容读取（前台）

统一从 `lib/api/index.ts` 导出：

- `listContents(params)`
- `getPrompt(id)`
- `getMcp(id)`
- `getSkill(id)`
- `getTutorial(id)`

当前默认 `mock` 模式（`NEXT_PUBLIC_API_MODE !== "http"`）；当 `NEXT_PUBLIC_API_MODE=http` 时，`lib/api/http.ts` 走 Django + DRF。

### 本地作者工作区（Authoring）

- API：`lib/api/authoring.ts`
- 存储：`lib/client/storage_authoring.ts`
- localStorage key：`luzi_authoring_v1`
- 作用：保存 Draft/PendingReview/Listed/Reject/Unlisted 等记录，刷新后仍保留。

### 本地互动（Social）

- API：`lib/api/social.ts`
- 存储：`lib/client/storage.ts`
- localStorage key：`luzi_social_v1`
- 作用：投票、收藏、评论本地持久化。

### 本地审计（Audit）

- API：`lib/api/audit.ts`
- 存储：`lib/client/storage_audit.ts`
- localStorage key：`luzi_audit_v1`
- 作用：后台审核动作写入审计日志（approve/reject/list/unlist/rollback）。

### 后台审核控制台（Admin Review）

- API：`lib/api/admin_review.ts`
- 数据源：复用 authoring records
- 口径：审核状态流转按 `docs/接口契约方案.md` + `docs/DECISIONS.md`，不按冲突状态图改写。

### 后台管理页数据层（Admin Console）

- API：`lib/api/admin_console.ts`
- HTTP 优先：当 `NEXT_PUBLIC_API_MODE=http` 时，请求 Django/DRF `admin/console` 端点
- fallback：HTTP 失败时自动回退 `lib/client/storage_admin.ts`（本地可用性兜底）
- localStorage key：`luzi_admin_console_v1`
- 覆盖页面：`/admin/categories`、`/admin/tags`、`/admin/events`

### 登录与权限管理（Django 原生）

- 普通用户前台登录：`/login`（手机号+验证码，验证码固定 `123456`）
- 普通用户前台注册：`/register`（昵称+手机号+验证码）
- Django Admin 登录入口：`http://127.0.0.1:8000/admin/login/`
- 用户管理：Django Admin 的 Users（`auth.User`，前台注册成功后可见）
- 权限管理：Django Admin 的 Groups / Permissions

## 路由与页面

- 全量路径清单：`docs/ROUTES.md`
- 当前用户态规则：未登录访问 `/me/**` 会跳转 `/login`；其余历史“无守卫”口径保持不变。

## SEO 与站点基础信息

- 全站 metadata：`app/layout.tsx`
- 列表段 metadata：`app/prompts|mcps|skills|tutorials/layout.tsx`
- 详情 metadata：`app/**/[id]/layout.tsx` 中 `generateMetadata`
- `public/robots.txt`
- `public/sitemap.xml`（核心静态路由）

## 文档入口

- 冲突决策：`docs/DECISIONS.md`
- 路由清单：`docs/ROUTES.md`
- 发布检查：`docs/CHECKLIST.md`
- 输入资料：
  - `docs/结构级页面方案（低保真）.md`
  - `docs/内容属性字段（资源）.md`
  - `docs/接口契约方案.md`
  - `docs/状态图与业务规则.md`
