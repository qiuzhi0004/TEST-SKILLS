# AI 资源站（Next.js App Router）

基于 Next.js + TypeScript + Tailwind 的资源站点原型，覆盖 Prompt / MCP / Skill / Tutorial 四类内容，包含：

- 前台列表/详情渲染（mock 数据驱动）
- Authoring（新建/编辑/提交）本地工作区
- 社交互动（投票/收藏/评论）本地持久化
- 后台审核控制台 + 审计日志本地落库
- 第 7 步发布级收尾：统一 UI、加载/错误/空态、SEO、响应式与文档化

> 冲突口径唯一真相源：`docs/DECISIONS.md`

## 技术栈

- Next.js 16（App Router）
- TypeScript
- Tailwind CSS（`@import "tailwindcss"`）

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
  api/                  # 对外 API 门面 + mock/social/authoring/admin_review/audit
  client/               # localStorage 读写封装（SSR 安全）
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

### 内容读取（前台）

统一从 `lib/api/index.ts` 导出：

- `listContents(params)`
- `getPrompt(id)`
- `getMcp(id)`
- `getSkill(id)`
- `getTutorial(id)`

当前默认 `mock` 模式（`NEXT_PUBLIC_API_MODE !== "http"`）。

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

## 路由与页面

- 全量路径清单：`docs/ROUTES.md`
- 本阶段（按 DECISIONS）：`/admin/**`、`/me/**`、`/new`、`/edit` 均可直接访问，不做守卫。

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
