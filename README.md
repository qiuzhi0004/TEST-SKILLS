# AI 资源站 - Step 1 基础骨架

本项目实现了第 1 步目标：

- Next.js (App Router) + TypeScript + Tailwind 可运行骨架
- DTO / ViewModel 类型分层
- 本地 JSON Mock API 层（函数签名固定，后续可替换真实 fetch）
- 全站 layout shell（顶部导航占位）+ Home 占位页
- 文档冲突统一决策：`docs/DECISIONS.md`

## 运行方式

> 当前环境若未安装全局 `pnpm`，可先使用 `npx pnpm`。

```bash
pnpm install
pnpm dev
```

访问：`http://localhost:3000`

## 目录约定

```txt
app/                 # App Router 入口（layout + Home 占位）
components/          # 基础组件（TopNav）
data/                # Mock 数据源 JSON
docs/                # 输入文档 + 决策说明
lib/api/             # API 封装（mock/http 占位）
types/               # DTO / ViewModel / adapters
```

## Mock 数据说明

- 数据文件：
  - `data/prompts.json`
  - `data/mcps.json`
  - `data/skills.json`
  - `data/tutorials.json`
  - `data/taxonomies.json`
- 每个资源至少 3 条样例数据。
- `lib/api/mock.ts` 负责读取 JSON 并输出 ViewModel。

## API 使用约定

统一从 `lib/api/index.ts` 导入（第 2 步页面继续复用）：

- `listContents(params)`
- `getPrompt(id)`
- `getMcp(id)`
- `getSkill(id)`
- `getTutorial(id)`

`NEXT_PUBLIC_API_MODE` 默认 `mock`。未来接真实接口时将其置为 `http`，并在 `lib/api/http.ts` 实现同签名函数。

## 文档来源

以下输入文档原样存放于 `docs/`：

- `docs/结构级页面方案（低保真）.md`
- `docs/内容属性字段（资源）.md`
- `docs/接口契约方案.md`
- `docs/状态图与业务规则.md`

冲突处理见 `docs/DECISIONS.md`。
