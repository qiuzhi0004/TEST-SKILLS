import { listContents } from "@/lib/api";
import { ResourceCard } from "@/components/resource/ResourceCard";
import type { ContentSummaryVM, ContentType } from "@/types/content";

const RANK_COLUMNS: Array<{ type: Exclude<ContentType, "all">; title: string }> = [
  { type: "prompt", title: "Prompt" },
  { type: "skill", title: "Skill" },
  { type: "mcp", title: "MCP" },
  { type: "tutorial", title: "教程" },
];

function scoreOf(item: ContentSummaryVM): number {
  return item.stats_7d.hot_score;
}

async function fetchTop10(type: Exclude<ContentType, "all">): Promise<ContentSummaryVM[]> {
  const res = await listContents({ type, offset: 0, limit: 80 });
  return res.items
    .filter((item) => item.status === "Listed")
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 10);
}

export default async function RanksPage() {
  const topLists = await Promise.all(RANK_COLUMNS.map((column) => fetchTop10(column.type)));
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {RANK_COLUMNS.map((column, columnIndex) => {
            const items = topLists[columnIndex];
            return (
              <section key={column.type} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
                  <span className="text-xs text-slate-500">Top 10</span>
                </div>
                <div className="space-y-2">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div key={item.id} className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">#{index + 1}</p>
                        <ResourceCard item={item} showTypeBadge={false} />
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                      暂无上榜内容
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
