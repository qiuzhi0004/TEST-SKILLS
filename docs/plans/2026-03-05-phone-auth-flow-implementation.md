# Phone Auth Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增普通用户手机号+验证码（固定 `123456`）登录/注册流程，未登录访问个人中心跳转登录，注册用户可在 Django 管理后台看到。

**Architecture:** 后端在 Django/DRF 新增 `auth` 端点，统一做手机号与验证码校验；注册直接创建 `django.contrib.auth.models.User`。前端新增 `/login` 与 `/register` 页面，并通过本地会话存储驱动导航和 `/me` 路由重定向。

**Tech Stack:** Next.js 16 + TypeScript + Tailwind, Django 4.2 + DRF, SQLite, Django auth.User

### Task 1: 后端契约测试（TDD RED）

**Files:**
- Create: `backend/api/tests/test_auth_phone_contract.py`

**Steps:**
1. 编写发送验证码、注册、登录的契约测试。
2. 运行 `cd backend && .venv/bin/python manage.py test api.tests.test_auth_phone_contract -v 2`，确认失败。

### Task 2: 后端鉴权 API 实现（TDD GREEN）

**Files:**
- Modify: `backend/api/views.py`
- Modify: `backend/api/urls.py`

**Steps:**
1. 增加 `send-code/login/register` 三个 APIView。
2. 增加手机号格式校验（11 位）和固定验证码校验（`123456`）。
3. 注册时创建 Django `auth.User`（手机号作为 username、昵称写入 first_name）。
4. 运行 Task 1 的测试，确认通过。

### Task 3: 前端登录注册页面 + 跳转守卫

**Files:**
- Create: `types/auth.ts`
- Create: `lib/api/auth_http.ts`
- Create: `lib/api/auth_local.ts`
- Create: `lib/api/auth.ts`
- Create: `lib/client/auth.ts`
- Create: `app/login/page.tsx`
- Create: `app/register/page.tsx`
- Modify: `components/TopNav.tsx`
- Modify: `components/me/MeLayoutClient.tsx`

**Steps:**
1. 新增前端鉴权 API 封装与本地会话存储。
2. 新增登录页（手机号+验证码，未注册提示去注册）。
3. 新增注册页（昵称+手机号+验证码，已注册提示去登录）。
4. 顶部“个人中心”在未登录时跳 `/login?next=/me/favorites`。
5. `/me` 页面布局增加未登录重定向兜底。

### Task 4: 文档与协作契约同步

**Files:**
- Modify: `docs/PAGE_LIST.md`
- Modify: `docs/ROUTES.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/DECISIONS.md`（TODO 追加）

**Steps:**
1. 增加登录/注册路由文档。
2. 更新 README 中“登录与权限管理”说明为“前台手机号登录 + 后台 Django Admin 管理”并标注验证码固定 `123456`（测试环境）。
3. 记录“/me 登录跳转”对既有无守卫口径的新增冲突到 DECISIONS TODO。

### Task 5: 回归验证

**Commands:**
- `cd backend && .venv/bin/python manage.py test api.tests.test_auth_phone_contract api.tests.test_admin_console_contract api.tests.test_admin_display -v 2`
- `cd backend && .venv/bin/python manage.py check`
- `NPM_CONFIG_CACHE=.npm-cache npx pnpm exec tsc --noEmit`
- `NPM_CONFIG_CACHE=.npm-cache npx pnpm lint`
- `NPM_CONFIG_CACHE=.npm-cache npx pnpm build`
