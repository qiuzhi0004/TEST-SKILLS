import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function RanksPage() {
  return (
    <PageShell title="榜单" subtitle="低保真块：type 切换 + 榜单列表">
      <SectionCard title="类型切换">
        <div className="flex flex-wrap gap-2 text-xs text-slate-700">
          {["prompt", "mcp", "skill", "tutorial"].map((type) => (
            <button key={type} className="rounded border border-slate-300 px-3 py-1" type="button">
              {type}
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="榜单内容">
        <Placeholder title="榜单计算与窗口占位" todos={["window_days", "date", "score 展示"]} />
      </SectionCard>
    </PageShell>
  );
}
