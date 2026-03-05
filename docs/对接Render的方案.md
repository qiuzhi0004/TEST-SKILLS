下面是一份**“不容器化”**的 Render 部署 Django 指南（你已用 Neon Postgres；前端在 Vercel，浏览器**直连 Render API**，所以重点会把 **Render 部署 + CORS 通信**讲透）。

---

## 1) 后端代码仓库准备（本地能跑 → 线上能跑）

### 1.1 requirements.txt 必备项

确保后端 `requirements.txt` 至少包含：

* `gunicorn`（生产启动用） ([Render][1])
* `psycopg2-binary` 或 `psycopg`（连 Postgres；你已连 Neon） ([Render][1])
* `whitenoise[brotli]`（强烈建议；否则 Django Admin 静态资源容易丢样式） ([Render][1])
* `django-cors-headers`（前端跨域访问 API 必备） ([GitHub][2])

### 1.2 强烈建议：在 Render 显式指定 Python 版本

Render 现在新建服务的默认 Python 版本很“新”，你最好显式指定一个你确认兼容的版本（比如 3.12.x / 3.13.x），避免部署时踩兼容坑。Render 支持用 `PYTHON_VERSION` 环境变量或 `.python-version` 文件设置版本。 ([Render][3])

> 你如果用 Django 5.2（LTS），官方说明它支持 Python 3.10–3.14（3.14 是在 5.2.8 以后）。 ([Django Project][4])
> 如果你是 Django 5.0，则只支持到 Python 3.12。 ([Django Project][5])
> 所以：**先确认你 requirements 里的 Django 版本，再选 Python 版本**。

---

## 2) Django 生产配置（Render 必需项）

### 2.1 ALLOWED_HOSTS（必须，否则 DEBUG=False 会报错）

Django 的 `ALLOWED_HOSTS` 是 Host Header 防护必配项。 ([Django Project][6])
Render 会自动提供 `RENDER_EXTERNAL_HOSTNAME`，官方示例就是把它 append 进 `ALLOWED_HOSTS`。 ([Render][1])

示例（放在 `settings.py`）：

```py
import os

ALLOWED_HOSTS = []
render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if render_host:
    ALLOWED_HOSTS.append(render_host)
```

### 2.2 静态文件（Django Admin 样式正常的关键）

Render 官方部署指南推荐用 WhiteNoise，并给出：

* `WhiteNoiseMiddleware` 放在 `SecurityMiddleware` 后面
* 生产环境设置 `STATIC_ROOT=.../staticfiles`
* 启用 `CompressedManifestStaticFilesStorage` ([Render][1])

示例：

```py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = os.environ.get("DEBUG") == "1"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # ...
]

STATIC_URL = "/static/"
if not DEBUG:
    STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
```

---

## 3) 前端直连 Render API：Django CORS 配置（你选的通信方式）

你前端域名是 `test-skills-seven.vercel.app`，浏览器请求 Render 的 API 会跨域，所以必须启用 CORS。

`django-cors-headers` 的核心配置是 `CORS_ALLOWED_ORIGINS`：列出允许跨域访问的 origin。 ([GitHub][2])

### 3.1 安装并启用

```py
INSTALLED_APPS = [
    # ...
    "corsheaders",
    # ...
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    # 注意：它要放在尽量靠前（通常在 CommonMiddleware 之前）
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

### 3.2 只放行你的 Vercel 域名（推荐最安全）

```py
CORS_ALLOWED_ORIGINS = [
    "https://test-skills-seven.vercel.app",
]
```

> 如果你未来用 Vercel Preview（每个预览一个新域名），可以改用 `CORS_ALLOWED_ORIGIN_REGEXES`（按正则放行），`django-cors-headers` 也支持。 ([GitHub][2])

---

## 4) 添加 Render 的 build 脚本（build.sh）

Render 官方建议创建 `build.sh`，内容就是：

* 安装依赖
* `collectstatic`
* `migrate` ([Render][1])

在后端根目录创建 `build.sh`：

```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

并确保它可执行： ([Render][1])

```bash
chmod a+x build.sh
```

> 你本地的 `seed_local_data`：**不要默认放进 build.sh**。线上每次部署都跑 seed 很容易重复灌数据。建议：上线后用 Render Shell 手动执行一次，或者把 seed 改成幂等后再考虑自动化。

---

## 5) Render 控制台创建 Web Service（非容器化）

### 5.1 如果你是 monorepo（你的路径里有 /backend）

强烈建议在 Render 服务里把 **Root Directory** 设为 `backend`，否则构建/运行时看不到仓库其他目录并且命令要写 `cd backend && ...`。Render 对 rootDir 的说明：设置后 build/start 都会相对于该目录执行。 ([Render][7])

### 5.2 基本配置（按 Render 官方 Django 文档）

在 Render Dashboard：

1. New → **Web Service**
2. 连接你的 GitHub repo
3. Language/Runtime 选 Python
4. Build Command：`./build.sh` ([Render][1])
5. Start Command（两种都行，照 Render 文档默认 ASGI 写法）：

   * **ASGI（推荐跟 Render 文档一致）**：
     `python -m gunicorn <你的项目名>.asgi:application -k uvicorn.workers.UvicornWorker` ([Render][1])
   * **WSGI（如果你不想引入 uvicorn worker）**：
     `python -m gunicorn <你的项目名>.wsgi:application --bind 0.0.0.0:$PORT`

> `<你的项目名>`：就是你 Django 项目里那个包含 `settings.py / wsgi.py / asgi.py` 的目录名。

---

## 6) Render 环境变量（必须项清单）

Render 官方示例里最少需要这些：`SECRET_KEY`、`WEB_CONCURRENCY`（以及数据库 URL）。 ([Render][1])
你数据库用 Neon，所以数据库相关变量按你当前接入方式填（两种选一）：

### 6.1 必填（强烈建议）

* `SECRET_KEY`：Render 控制台可以 Generate ([Render][1])
* `DEBUG`：不要开（保持 False/不设置，按你的代码来）
* `PYTHON_VERSION`：建议显式写一个你确认兼容的版本，例如 `3.12.8`（示例） ([Render][3])
* `WEB_CONCURRENCY=4`（可先照抄 Render 示例，后续看资源再调） ([Render][1])

### 6.2 数据库（你已接入 Neon，按你项目方式填）

* 如果你用 `DATABASE_URL`：就在 Render 环境变量里放 `DATABASE_URL=...`
* 如果你用分散变量（PGHOST/PGUSER/…）：就按你现有 settings 读取方式把它们都填进去
  （Neon 通常要求 SSL，你应该已经配过了。）

---


---

## 8) 前端（Vercel）怎么改才能打通 Render API

你现在本地用 `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1`
上线后把它改成 Render 的公网地址：

```bash
NEXT_PUBLIC_API_BASE_URL=https://<你的-render-服务>.onrender.com/api/v1
NEXT_PUBLIC_DJANGO_ADMIN_URL=https://<你的-render-服务>.onrender.com/admin/
```

注意：Next.js 的 `NEXT_PUBLIC_` 变量会在 `next build` 时被内联进产物，所以**改完 Vercel 环境变量后要重新部署**。 ([Next.js][8])

---

## 9) 验收清单（最快定位“通了没”）

1. **Render 后端健康**

* 打开 `https://<render>/admin/` 能看到登录页且有样式（静态文件 OK）
* 打开你任意 API（比如 `/api/v1/...`）能返回 JSON（后端 OK）

2. **CORS 是否正确**

* 打开前端页面，浏览器 DevTools → Network
* 观察 API 请求是否成功；如果报 CORS，通常是：

  * `CORS_ALLOWED_ORIGINS` 少了 `https://test-skills-seven.vercel.app`
  * `CorsMiddleware` 顺序不对（没生效）

3. **常见错误快速对照**

* `DisallowedHost`：没配好 `ALLOWED_HOSTS`（优先用 `RENDER_EXTERNAL_HOSTNAME` 方案） ([Render][1])
* Admin 无样式：没跑 `collectstatic` / 没配 WhiteNoise ([Render][1])
* 免费服务首次访问慢：Render Free 会 15 分钟无流量自动休眠，下次请求会唤醒（大约 1 分钟） ([Render][9])

---


[1]: https://render.com/docs/deploy-django "Deploy a Django App on Render – Render Docs"
[2]: https://github.com/adamchainz/django-cors-headers?utm_source=chatgpt.com "adamchainz/django-cors-headers"
[3]: https://render.com/docs/python-version "Setting Your Python Version – Render Docs"
[4]: https://docs.djangoproject.com/en/6.0/releases/5.2/?utm_source=chatgpt.com "Django 5.2 release notes"
[5]: https://docs.djangoproject.com/en/6.0/releases/5.0/?utm_source=chatgpt.com "Django 5.0 release notes"
[6]: https://docs.djangoproject.com/en/6.0/ref/settings/?utm_source=chatgpt.com "Settings | Django documentation"
[7]: https://render.com/docs/monorepo-support?utm_source=chatgpt.com "Monorepo Support"
[8]: https://nextjs.org/docs/pages/guides/environment-variables?utm_source=chatgpt.com "Guides: Environment Variables"
[9]: https://render.com/docs/free?utm_source=chatgpt.com "Deploy for Free – Render Docs"
