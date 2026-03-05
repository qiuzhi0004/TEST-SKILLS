# Backend (Django + DRF)

## 1. Requirements

- Python 3.9+
- pip

## 2. Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_local_data
python manage.py runserver 127.0.0.1:8000
```

## 3. API Base URL

- `http://127.0.0.1:8000/api/v1`
- Django Admin: `http://127.0.0.1:8000/admin/`（登录页：`/admin/login/`）
- Django Admin 顶部“查看站点”默认跳转：`/admin/`（可用环境变量 `DJANGO_ADMIN_SITE_URL` 覆盖，例如 `http://127.0.0.1:3100/`）

## 4. Key Endpoints

- `GET /health`
- `POST /auth/send-code`（短信占位接口，返回固定验证码 `123456`）
- `POST /auth/login`（手机号 + 验证码登录）
- `POST /auth/register`（昵称 + 手机号 + 验证码注册，写入 `auth.User`）
- `GET /contents`
- `GET /prompts/{id}`
- `GET /mcps/{id}`
- `GET /skills/{id}`
- `GET /tutorials/{id}`

- `GET|POST /authoring/records`
- `GET|PATCH|DELETE /authoring/records/{type}/{id}`
- `POST /authoring/records/{type}/{id}/submit`
- `POST /authoring/records/{type}/{id}/status`

- `GET /social/vote`
- `POST /social/vote/toggle`
- `GET /social/favorite`
- `POST /social/favorite/toggle`
- `GET /social/favorites`
- `GET|POST /social/comments`
- `DELETE /social/comments/{comment_id}`

- `GET|POST /audit/logs`

- `GET /admin/review/queue`
- `GET /admin/review/items/{type}/{id}`
- `POST /admin/review/items/{type}/{id}/{approve|reject|list|unlist|rollback}`

- `GET|POST /admin/console/categories`
- `POST /admin/console/categories/{id}/status`
- `GET|POST /admin/console/tags`
- `POST /admin/console/tags/{id}/status`
- `GET /admin/console/events`
- `GET /admin/console/event-actors`

用户管理和权限管理使用 Django Admin 开箱能力（`auth.User` / `auth.Group` / permissions），不再走自定义前端页面与接口。
分类管理和标签管理使用 Django 模型（`AdminCategory` / `AdminTag`），可在 Django Admin 直接维护，且与 `admin/console` API 共享数据。

## 5. Seeding

- 自动 seed：每次 API 首次请求会触发 `ensure_bootstrapped()`。
- 手动 seed：`python manage.py seed_local_data --force`

## 6. Frontend Integration

前端在以下配置时走后端：

```bash
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_DJANGO_ADMIN_URL=http://127.0.0.1:8000/admin/
```

当前已接通：
- `lib/api/http.ts`（内容列表与详情）
- `lib/api/admin_console.ts`（分类/标签/事件：HTTP 优先，失败回退 localStorage）
- `lib/api/auth.ts`（手机号登录/注册：`NEXT_PUBLIC_API_MODE=http` 时对接本后端）

## 7. Contract Tests

```bash
cd backend
source .venv/bin/activate
python manage.py test api.tests.test_admin_console_contract -v 2
python manage.py test api.tests.test_auth_phone_contract -v 2
```
