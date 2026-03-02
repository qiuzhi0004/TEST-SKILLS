# 发布前检查清单（Step 7）

## 1. 路由覆盖

- [ ] `docs/ROUTES.md` 中每条路由可访问
- [ ] TopNav/SideNav/资源卡片跳转无断链
- [ ] 无“纯死页”：每页至少有信息结构 + 空态/加载态/错误态之一

## 2. 状态与提示

- [ ] 详情页 `status != Listed` 时显示 `StatusBanner`
- [ ] `Reject` 状态可展示驳回原因（取不到时显示“暂无原因”）
- [ ] 占位交互有明确提示（本期未实现）

## 3. 前台体验一致性

- [ ] 列表页结构统一：FilterBar + List + Pagination
- [ ] 详情页结构统一：Header + SectionCard + 右侧信息 + 评论区
- [ ] 空态统一使用 `EmptyState`

## 4. 后台闭环

- [ ] 审核队列可筛选并进入详情
- [ ] 审核动作（通过/驳回/上架/下架/回滚）可执行
- [ ] 每次动作写入审计日志并可查看

## 5. SEO 与可访问性

- [ ] 全站 metadata 生效（title template/description/OG）
- [ ] 列表/详情段 metadata 生效
- [ ] `robots.txt` 与 `sitemap.xml` 存在
- [ ] 移动端 TopNav 可操作
- [ ] 关键控件具备 aria/label 与 focus 样式

## 6. 工程质量

- [ ] `pnpm dev` 可运行
- [ ] `pnpm build` 通过
- [ ] `pnpm lint` 无 error
- [ ] `pnpm exec tsc --noEmit` 无 error
- [ ] README 已说明 mock、authoring、social、audit、admin_review 本地机制

## 7. 冲突口径

- [ ] 仅遵循 `docs/DECISIONS.md`
- [ ] 若发现新冲突，仅追加到 `DECISIONS.md` 的 TODO 区，不改既有口径
