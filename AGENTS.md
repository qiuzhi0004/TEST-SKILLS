# AGENTS.md

## Changelog
- 2026-03-05: 新增普通用户手机号验证码登录/注册（`/login`、`/register`）与 `lib/api/auth.ts`。
- 2026-03-05: `/me/**` 新增用户态登录跳转（未登录重定向到 `/login`），顶部“个人中心”入口联动登录态。
- 2026-03-05: 后端新增 `auth/send-code|login|register` 端点与手机号鉴权 contract tests。
- 2026-03-05: 后端新增 `AdminCategory`/`AdminTag` 模型，Django Admin 可直接管理分类与标签。
- 2026-03-05: `admin/console` 分类与标签接口改为读写数据库模型，事件日志仍走 `StateDocument(admin_console_state)`。
- 2026-03-05: `admin_console` 改为 `NEXT_PUBLIC_API_MODE=http` 时优先走 Django/DRF，失败自动回退 localStorage。
- 2026-03-05: 新增后台 Admin Console API contract tests（categories/tags/events）。
- 2026-03-05: 登录、用户管理、权限管理切换为 Django Admin 原生能力，删除前端对应页面。
- 2026-03-05: 引入 `backend/` Django + DRF 后端工程（首期 API + SQLite + seed 命令）。
- 2026-03-05: 新增后端启动/迁移/seed 协作命令约定。
- 2026-03-04: 新增后台管理本地数据层约定（admin_console API + storage_admin）。
- 2026-03-04: 明确后台 8 个管理页统一走 `lib/api/admin_console.ts`，禁止页面直读写 localStorage。
- 2026-03-03: 初始化根目录协作契约文档（首次创建）。
- 2026-03-03: 固化“每次新任务先确认疑问/冲突，再执行”的最高优先级规则。
- 2026-03-03: 同步当前仓库可运行命令、目录边界、数据导入规范与 DoD。

## 1. Purpose

本文件是本仓库的持续维护协作契约，定义 AI coding agent 与协作者之间的执行规则。

约束优先级：
1. 用户在当前会话明确声明的最高优先级规则
2. `docs/DECISIONS.md`（业务口径真相源）
3. 本文件（协作与工程执行约定）

本文件不得更改业务口径；若与业务口径冲突，必须以 `docs/DECISIONS.md` 为准。

## 2. Permanent Rules (Highest Priority)

1. 每次接到新任务时，必须先明确说明“是否有疑问”。
2. 若存在任何不确定、缺失上下文、或与现有记录冲突，必须先提问澄清，再执行。
3. 仅当确认“无疑问、无冲突”时，才可直接开始执行。
4. `AGENTS.md` 是活文档：当任务引入新的协作约束/命令/结构/规范/质量门槛时，需在同次提交同步更新本文件。
5. 不为更新而更新：若任务未改变协作契约，PR/提交说明中写：
   - `AGENTS.md: no change (no contract/process changes)`

## 3. Start-of-Task Checklist (Mandatory)

每次开始任务前必须执行：

1. 阅读：
   - `AGENTS.md`
   - `docs/DECISIONS.md`
2. 判断是否影响以下任一项：
   - `package.json` scripts（新增/改名/删除）
   - 目录结构与模块边界
   - 数据/mock 规范（`data/*.json`、`taxonomies.json`、localStorage keys、导入脚本）
   - API/adapter 调用约定（是否绕过 `lib/api/*`）
   - 质量门槛（build/typecheck/lint/test）
   - 新发现缺口/冲突（需记录 TODO/Open Questions）
3. 若有影响：必须同步更新 `AGENTS.md`。

## 4. End-of-Task Checklist (Mandatory)

1. 若更新 `AGENTS.md`：
   - 在对应章节原位更新，不在末尾堆补丁
   - 保持结构清晰与可检索
   - 维护顶部 Changelog（日期 + 1-3 条变化）
2. 若不更新：
   - 在任务总结写：`AGENTS.md: no change (no contract/process changes)`

## 5. Current Project Snapshot

### 5.1 Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Django 4.2 LTS + Django REST Framework（`backend/`，首期后端）

### 5.2 Key Commands
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm import:seed`（从 `docs/数据源信息.md` 导入种子数据）
- `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- `cd backend && python manage.py migrate`
- `cd backend && python manage.py seed_local_data`
- `cd backend && python manage.py runserver 127.0.0.1:8000`

无全局 `pnpm` 时可使用：
- `NPM_CONFIG_CACHE=.npm-cache npx pnpm <command>`

### 5.3 Repo Map (High-level)
- `app/`：路由与页面
- `components/`：UI/布局/资源卡/社交/后台组件
- `lib/api/`：统一 API 门面与实现（mock/authoring/social/audit/admin_review/admin_console）
- `lib/client/`：localStorage 存取封装（SSR-safe，含 `storage_admin` 与用户会话 `auth`）
- `backend/`：Django + DRF 后端（`api/` 应用、SQLite、seed 命令）
- `types/`：DTO / ViewModel / adapters
- `data/`：mock 数据
- `docs/`：规范、路由、决策与检查清单
- `scripts/`：工程脚本（当前含导入脚本）

## 6. Data & Mock Contract

1. 页面与组件优先通过 `lib/api/*` 访问数据，不直接读写 `data/*.json` 或 `localStorage`。
2. 导入脚本：`scripts/import_seed_from_docs.js`
   - 数据源：`docs/数据源信息.md`
   - 合并去重（不覆盖已有数据）
   - 去重键优先级：`repo -> url -> title`
3. `taxonomies.json` 新增项必须去重且保持稳定排序。
4. 当前前端口径：`category_ids[]`（多类目），不回退为单值 `category_id` 逻辑。
5. 后台管理页（分类/标签/事件日志）统一通过 `lib/api/admin_console.ts` 访问；
   - `NEXT_PUBLIC_API_MODE=http` 时优先请求 Django/DRF：`/admin/console/*`
   - HTTP 请求失败自动回退到本地存储实现（`lib/client/storage_admin.ts`）
   - 本地存储 key：`luzi_admin_console_v1`
   - 页面层不得直接读写 `localStorage`。
6. 普通用户登录/注册采用手机号+验证码（当前验证码固定 `123456`）：
   - 前端页面：`/login`、`/register`
   - 前端接口：`lib/api/auth.ts`（`NEXT_PUBLIC_API_MODE=http` 时走 Django/DRF；非 http 走本地 mock）
   - 前端会话：`lib/client/auth.ts`（localStorage key: `luzi_auth_session_v1`）
7. 后台用户管理、权限管理仍使用 Django Admin 原生能力：
   - 登录入口：`/admin/login/`（Django 内置）
   - 用户/组/权限管理：Django Admin 默认页面（`auth.User` / `auth.Group` / permissions）
   - 当前注册用户写入 `auth.User`，可在 Django Admin 直接查看。
8. 后端分类与标签管理使用数据库模型：
   - 模型：`AdminCategory`（`admin_categories`）、`AdminTag`（`admin_tags`）
   - Django Admin 可直接维护分类与标签；`admin/console` API 与其共用同一数据源。

## 7. Decision Alignment (Must Keep)

执行时必须保持以下已固化口径：
- 默认不做鉴权守卫（`/admin/**`、`/new`、`/edit` 可访问）；`/me/**` 例外：未登录需跳转 `/login`
- 状态流转冲突按接口契约口径执行
- MCP `how_to_use` 使用三段原样文本
- Skill 缺失字段由前端补齐并保留 TODO

若发现新冲突：仅追加到 `docs/DECISIONS.md` 的 TODO 区，不擅自改口径。

## 8. Quality Gates (Definition of Done)

任务完成前，至少应验证：
- `pnpm build` 通过
- `pnpm lint` 无 error（warning 可单独说明）
- `pnpm exec tsc --noEmit` 通过
- 若改动 `backend/`：`cd backend && python manage.py check` 至少通过
- 若改动 Admin Console API 契约：`cd backend && python manage.py test api.tests.test_admin_console_contract` 通过
- 若改动手机号登录注册：`cd backend && python manage.py test api.tests.test_auth_phone_contract` 通过
- 变更与 `README.md` / `docs/*` 一致

## 9. Documentation Boundaries

允许写入 `AGENTS.md`：
- Setup 命令、Repo map、协作流程、质量门槛、开放问题

禁止写入：
- 密钥/token/隐私链接
- 大段提示词原文/聊天记录
- 仓库中不存在或不可运行的命令

## 10. Sub-Agent Docs

当前无额外子目录 agents 协作文档。
若后续新增，需在本节登记其路径与用途。
