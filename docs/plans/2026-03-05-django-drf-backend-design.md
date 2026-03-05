# Django + DRF Backend Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保留前端现有页面与交互口径的前提下，引入可运行的 Django + DRF 后端，提供内容读取与后台管理相关 API 的统一服务端实现。

**Architecture:** 新增 `backend/` 独立 Django 工程，使用 SQLite 落库。内容主数据用 `ContentRecord`（结构化索引字段 + `detail` JSON）承载；authoring/social/audit/admin-console 用 `StateDocument` JSON 文档承载，先保证与现有前端口径一致。前端通过 `lib/api/http.ts` 在 `NEXT_PUBLIC_API_MODE=http` 时走后端。

**Tech Stack:** Django 4.2 LTS, Django REST Framework, django-cors-headers, SQLite, Next.js 16。

## 1. Why This Design

1. 现有前端 API 面较宽（content + authoring + social + audit + admin review + admin console），一次性做完全关系型会显著拉长交付周期。
2. `ContentRecord + StateDocument` 组合能在首期快速落地，且保留后续拆分为细粒度关系模型的演进空间。
3. 后端 seed 直接复用仓库 `data/*.json`，前后端口径对齐成本最低。
4. 保持 `NEXT_PUBLIC_API_MODE` 兼容：mock 与 http 模式可随时切换，降低迁移风险。

## 2. API Mapping

1. 内容读取：`GET /api/v1/contents`、`GET /api/v1/{prompts|mcps|skills|tutorials}/{id}`。
2. Authoring：records 的创建、查询、草稿更新、提审、状态流转、删除。
3. Social：投票、收藏、评论 CRUD、收藏目标列表。
4. Audit：审计日志查询与追加。
5. Admin Review：审核队列、审核项详情、approve/reject/list/unlist/rollback。
6. Admin Console：分类、标签、事件日志接口（用户/组/权限改由 Django Admin 原生页面）。

## 3. Data Lifecycle

1. `python manage.py migrate` 建表。
2. `python manage.py seed_local_data` 导入 `data/*.json` 与默认状态文档。
3. 所有 API 请求在首访自动触发 `ensure_bootstrapped()`，避免忘记手工 seed。

## 4. Risk & Mitigation

1. 风险：JSON 文档状态并发写覆盖。
   - 缓解：首期以单机开发环境为目标，后续升级为乐观锁或拆分模型。
2. 风险：前端 admin/social/authoring 仍有本地实现。
   - 缓解：后端端点已到位，前端可按模块逐步切换，不阻塞当前功能。
3. 风险：本机未安装 Django 导致无法即刻运行。
   - 缓解：在 `backend/requirements.txt` 与 README 明确安装步骤。

## 5. Execution Checklist

1. 新建 `backend/` Django 工程与 `api` 应用。
2. 实现模型、迁移与 seed 命令。
3. 实现 DRF 路由与视图。
4. 实现前端 `lib/api/http.ts` 与后端内容接口联通。
5. 更新 README、AGENTS、计划文档。
6. 运行语法校验与（若环境允许）Django 启动验证。

## 6. Future Evolution (Phase 2+)

1. 将 `StateDocument` 的 admin_console（分类/标签/事件）按需拆分为关系模型；用户权限继续走 Django `auth`。
2. 增加鉴权（JWT / Session）与角色权限校验。
3. 将 `authoring` 与 `social` 模块切换到后端 API（前端移除 localStorage 主路径）。
4. 增加 DRF serializer + 自动 OpenAPI 文档。
