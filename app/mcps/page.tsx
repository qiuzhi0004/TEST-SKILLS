import { FilterBar } from "@/components/resource/FilterBar";
import { ResourceList } from "@/components/resource/ResourceList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function McpsPage() {
  const { items } = await listContents({ type: "mcp", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="MCP 列表"
      subtitle="低保真块：搜索/筛选/排序 + 卡片区"
      filterSlot={<FilterBar typeLabel="MCP" />}
      listSlot={<ResourceList items={items} />}
      paginationSlot={<p className="text-sm text-slate-500">分页 UI 占位（offset/limit/total）</p>}
    />
  );
}
