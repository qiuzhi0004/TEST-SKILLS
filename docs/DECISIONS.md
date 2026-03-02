# Step 1 固化决策（必须遵守）

本文件记录输入文档冲突的最终执行口径。后续步骤如与本文件冲突，以本文件为准。

## 1) 鉴权守卫冲突

- 冲突来源：
  - 页面方案要求 `/new`、`/edit`、`/me/**`、`/admin/**` 做 401/403 守卫与跳转。
  - 当前阶段目标要求“全部页面可直接访问”，不做守卫与登录校验。
- 当前决策：
  - 第 1 步不实现守卫逻辑，不实现登录校验。
  - 仅保留页面/组件结构占位。
  - 类型中保留 `status` 字段，为第 2 步行为控制预留。

## 2) 状态机规则冲突（以 API 契约方案为准）

- 冲突来源：
  - `状态图与业务规则.md` 与 `接口契约方案.md` 对编辑保存后的状态流转描述不同。
- 当前决策：
  - 以 `接口契约方案.md`（B 口径）为准。
  - 允许编辑 `PendingReview / Listed / Reject`；保存后自动转 `PendingReview`。
  - `Unlisted` 未修改保存可转 `Approved`（再 list）；修改保存转 `PendingReview`。

## 3) 分类字段冲突（前端统一多类目）

- 冲突来源：
  - 字段文档主口径为 `category_ids[]`（多类目）。
  - API 契约 `ContentBase` 为 `category_id`（单值），列表还有 `category object`。
- 当前决策：
  - 前端 ViewModel 统一使用 `category_ids[]`。
  - 适配层负责把 `category_id` 或 `category object` 映射为 `category_ids[]`。
  - 标签口径保留 `tag_ids[]`。

## 4) MCP how_to_use 字段冲突（以字段文档为准）

- 冲突来源：
  - 字段文档要求三段“原样文本”：
    - `how_to_use.json_config_text`
    - `how_to_use.common_clients_json`
    - `how_to_use.runtime_modes_json`
  - API 契约给的是 object：`howto.standard_config/clients/runtime`。
- 当前决策：
  - 前端类型与 mock 数据按字段文档使用三段原样文本。
  - adapter 中保留 TODO：后端需补字段或提供稳定转换策略。

## 5) Skill 详情缺字段（前端先补）

- 冲突来源：
  - 字段文档要求 `install_commands[]`、`usage_doc`（repo_url 为空时必填）、`zip_asset_id` 必有。
  - API 契约 `SkillDetail` 未定义 `install_commands` / `usage_doc`。
- 当前决策：
  - 前端类型与 mock 数据先包含这些字段。
  - adapter 保留 TODO：后端补齐契约。

## TODO（新增冲突记录）

- 当前阶段未发现新的口径冲突；若后续发现，仅在本节追加记录，不直接改既有执行口径。
