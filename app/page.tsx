import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";
import { listContents } from "@/lib/api";

export default async function HomePage() {
  const { items, meta } = await listContents({ type: "all", offset: 0, limit: 6 });
  return (
    <PageShell title="首页" subtitle="低保真块：大搜索 + 混合卡片结果区">
      <SectionCard title="首页大搜索">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="输入关键词开始全站搜索（占位）"
              disabled
            />
            <button className="rounded border border-slate-300 px-3 py-2 text-sm" type="button">
              搜索
            </button>
          </div>
          <Placeholder title="首页搜索逻辑占位" todos={["混合流检索", "highlight", "加载更多"]} />
        </div>
      </SectionCard>
      <SectionCard title="搜索结果区（占位预览）">
        <h2 className="text-sm font-semibold text-slate-900">Mock API 预览（前 6 条）</h2>
        <p className="mt-1 text-xs text-slate-500">total: {meta.total}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item.id} className="rounded border border-slate-200 px-3 py-2">
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-xs uppercase text-slate-500">{item.type}</span>
              <span className="ml-2 text-xs text-slate-500">{item.status}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </PageShell>
  );
}
