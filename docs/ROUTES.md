# 路由清单（Step 2）

来源：`docs/结构级页面方案（低保真）.md` 第 1 节页面树。  
执行口径：`docs/DECISIONS.md`（本阶段不做守卫，所有页面可直接访问）。

| Path | 页面名称 | 页面类型 | 对应低保真章节 |
|---|---|---|---|
| `/` | 首页 | Home/搜索结果流 | 1.1 网站首页（Home） |
| `/prompts` | Prompt 列表 | 列表 | 1.2 前台资源 |
| `/prompts/new` | Prompt 创建 | 发布/创建 | 1.2 前台资源 |
| `/prompts/[id]` | Prompt 详情 | 详情 | 1.2 前台资源 |
| `/prompts/[id]/edit` | Prompt 编辑 | 编辑 | 1.2 前台资源 |
| `/skills` | Skill 列表 | 列表 | 1.2 前台资源 |
| `/skills/new` | Skill 创建 | 发布/创建 | 1.2 前台资源 |
| `/skills/[id]` | Skill 详情 | 详情 | 1.2 前台资源 |
| `/skills/[id]/edit` | Skill 编辑 | 编辑 | 1.2 前台资源 |
| `/mcps` | MCP 列表 | 列表 | 1.2 前台资源 |
| `/mcps/new` | MCP 创建 | 发布/创建 | 1.2 前台资源 |
| `/mcps/[id]` | MCP 详情 | 详情 | 1.2 前台资源 |
| `/mcps/[id]/edit` | MCP 编辑 | 编辑 | 1.2 前台资源 |
| `/tutorials` | 教程列表 | 列表 | 1.2 前台资源 |
| `/tutorials/new` | 教程创建 | 发布/创建 | 1.2 前台资源 |
| `/tutorials/[id]` | 教程详情 | 详情 | 1.2 前台资源 |
| `/tutorials/[id]/edit` | 教程编辑 | 编辑 | 1.2 前台资源 |
| `/ranks` | 榜单页 | 榜单 | 1.3 榜单 |
| `/login` | 登录页 | 账户 | 1.4 账户与个人中心 |
| `/me/favorites` | 个人中心-收藏 | 个人中心 | 1.4 账户与个人中心 |
| `/me/published` | 个人中心-发布内容 | 个人中心 | 1.4 账户与个人中心 |
| `/admin` | 后台首页 | 后台 | 1.5 后台（Admin） |
| `/admin/categories` | 分类管理 | 后台管理 | 1.5 后台（Admin） |
| `/admin/tags` | 标签管理 | 后台管理 | 1.5 后台（Admin） |
| `/admin/moderation/cases` | 内容审核列表 | 后台审核 | 1.5 后台（Admin） |
| `/admin/moderation/cases/[case_id]` | 审核详情 | 后台审核详情 | 1.5 后台（Admin） |
| `/admin/events` | 事件日志 | 后台日志 | 1.5 后台（Admin） |
| `/admin/audit-logs` | 审计日志 | 后台日志 | 1.5 后台（Admin） |
| `/admin/users` | 用户管理 | 后台管理 | 1.5 后台（Admin） |
| `/admin/users/[user_id]` | 用户详情 | 后台管理详情 | 1.5 后台（Admin） |
| `/admin/roles` | 角色管理 | 后台管理 | 1.5 后台（Admin） |
| `/admin/permissions` | 权限管理 | 后台管理 | 1.5 后台（Admin） |
| `/admin/role-permissions` | 权限矩阵编辑 | 后台管理 | 1.5 后台（Admin） |

## TODO（路径歧义）

- 本次低保真文档中上述路由路径均已明确，未发现缺失 path 的页面。
