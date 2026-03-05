# SESSION FULL SUMMARY (2026-03-05)

## 1. 本次会话目标与范围

本轮工作覆盖了以下核心方向：

- 引入后端：Django + DRF（`backend/`）并与前端联调。
- 后台能力收敛：后台登录/用户/权限统一使用 Django Admin 开箱能力。
- Admin Console 精简：仅保留 `taxonomies(分类/标签)` + `events`，并保留 localStorage fallback。
- 普通用户体系：新增手机号 + 验证码（当前固定 `123456`）登录/注册流程。
- 个人中心改造：未登录跳转登录页；修复 hydration / 无限更新问题；补充退出登录。
- 数据库外部化：后端接入 Neon Postgres（`DATABASE_URL` 驱动）。

---

## 2. 需求与交付汇总（按任务线）

### 2.1 项目结构与后端接入

- 规划并落地 Django + DRF 后端工程，目录为 `backend/`。
- 后端提供 API 基础能力、种子导入命令、SQLite 初始运行路径。
- 前端通过 `NEXT_PUBLIC_API_MODE=http` 对接 HTTP API，失败回退本地实现。

### 2.2 后台功能取舍（按你要求）

- 后台“登录、用户管理、权限管理”全部改为 Django Admin 默认实现。
- 删除前端自建的相关后台页面（users/roles/permissions/role_permissions）。
- 后台类型与本地 schema 精简，收敛到分类/标签/事件主路径。

### 2.3 Admin Console 数据路径切换

- `admin_console` 从 localStorage 切到 Django/DRF HTTP（保留 fallback）。
- 增加最小 API contract tests，覆盖 categories/tags/events 三类端点。

### 2.4 Django Admin 可用性与展示优化

- 修复 Admin 顶部“查看站点”404（根路径未配置导致）。
- 指导后端重启命令与一键启动命令。
- 按你的文案要求修改后台相关标题展示。
- 后台新增“分类管理/标签管理”并可直接维护。
- `ContentRecord` 中“分类 ID 列表/标签 ID 列表”改为更友好的可选方式（非手输 ID）。

### 2.5 普通用户登录注册（前台）

- 新增未登录访问个人中心时跳转 `/login`。
- 新增 `/login` 与 `/register` 页面：
  - 登录：手机号 + 验证码（固定 `123456`）；
  - 注册：昵称 + 11 位手机号 + 验证码（固定 `123456`）；
  - 未注册登录提示去注册；已注册再注册提示去登录。
- 注册用户写入 Django `auth.User`，可在 Django Admin 看到。

### 2.6 个人中心稳定性与体验修复

- 修复进入“个人中心”出现的 3 个报错：
  - `getSnapshot should be cached`
  - `Maximum update depth exceeded`（两类）
- 根因：`useSyncExternalStore` snapshot 引用不稳定（每次 parse 新对象）。
- 修复：auth snapshot 缓存 + 稳定 server snapshot，消除无限更新链。
- 按你最新要求，把“管理登录”按钮改为“退出登录”，点击后清除前台登录态并跳回登录页。

### 2.7 外部数据库（Neon Postgres）接入

- 新增依赖：`dj-database-url`、`python-dotenv`、`psycopg[binary]`。
- `settings.py` 改为优先读取 `DATABASE_URL`，否则回退 SQLite。
- 配置 `ssl_require`、`conn_health_checks=True`、`DB_CONN_MAX_AGE=0`、`DISABLE_SERVER_SIDE_CURSORS=True`。
- 完成 `migrate` 与 `seed_local_data --force`，连接已验证为 PostgreSQL。

---

## 3. 当前运行与配置事实

- 后端配置文件：
  - `backend/config/settings.py`
- 环境变量示例：
  - `backend/.env.example`
- 本地敏感配置：
  - `backend/.env`（已忽略，不入库）
- 忽略规则：
  - `backend/.gitignore` 包含 `.env`
  - 根 `.gitignore` 允许提交 `backend/.env.example`

---

## 4. 生产环境发布前“必须做”清单（重点）

> 以下为上线前硬要求，请按顺序执行。

1. 立即轮换数据库凭据（必须）
- 本次会话中出现过完整连接串，视同已暴露。
- 在 Neon 立即重置密码/新建连接串，替换旧 `DATABASE_URL`。

2. 生产环境禁止使用本地 `.env` 明文分发（必须）
- 凭据放入部署平台 Secrets（如 Vercel/Render/Fly/自建 CI Secret Store）。
- 代码仓库仅保留 `.env.example` 占位，不保留真实值。

3. Django 生产安全参数（必须）
- `DEBUG=False`
- 设置真实 `SECRET_KEY`（不可使用开发值）
- 收敛 `ALLOWED_HOSTS`（不可 `*`）
- CORS 仅允许生产前端域名（不可全放开）

4. 数据库连接与权限（必须）
- 使用最小权限账号，不要长期使用 owner 账号直接跑业务。
- 保持 `sslmode=require`。
- 生产建议保留 `DB_CONN_MAX_AGE=0`（Neon serverless 场景）。

5. 迁移与回滚预案（必须）
- 发布前执行 `python manage.py migrate`。
- 保留备份与回滚方案（schema + 数据）。
- 关键表先在预发环境演练迁移。

6. 前后端环境变量对齐（必须）
- 前端：
  - `NEXT_PUBLIC_API_MODE=http`
  - `NEXT_PUBLIC_API_BASE_URL=<prod-api>/api/v1`
  - `NEXT_PUBLIC_DJANGO_ADMIN_URL=<prod-admin>/admin/`
- 后端：
  - `DATABASE_URL=<new neon url>`
  - `SECRET_KEY=<prod-secret>`
  - `DEBUG=False`
  - `ALLOWED_HOSTS=<prod-hosts>`

7. 发布前验证（必须）
- 前端：`pnpm lint`、`pnpm exec tsc --noEmit`、`pnpm build`
- 后端：`python manage.py check`
- 契约测试（后端）：
  - `python manage.py test api.tests.test_admin_console_contract`
  - `python manage.py test api.tests.test_auth_phone_contract`

8. 账号与登录策略（建议）
- 当前短信验证码是占位实现（固定 `123456`），正式环境必须替换为真实短信服务与限流策略。
- 增加登录/注册频率限制、IP 限流、失败审计日志。

---

## 5. 已知限制与后续建议

- 当前普通用户登录注册仍为“演示验证码”，仅适合开发/联调，不可直接上生产。
- 后台与前台登录体系分离：
  - 后台用 Django Admin 账户体系；
  - 前台用手机号验证码体系（业务用户）。
- 若进入生产，建议新增：
  - 密码/短信验证码审计日志；
  - 访问与错误监控（Sentry + API 监控）；
  - DB 凭据自动轮换流程。

---

## 6. 一键核对命令（可直接执行）

```bash
# 前端
NPM_CONFIG_CACHE=.npm-cache npx pnpm lint
NPM_CONFIG_CACHE=.npm-cache npx pnpm exec tsc --noEmit
NPM_CONFIG_CACHE=.npm-cache npx pnpm build

# 后端
cd backend
source .venv/bin/activate
python manage.py check
python manage.py migrate
python manage.py seed_local_data --force
python manage.py test api.tests.test_admin_console_contract -v 2
python manage.py test api.tests.test_auth_phone_contract -v 2
python manage.py runserver 127.0.0.1:8000
```

