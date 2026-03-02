import { FilterBar } from "@/components/resource/FilterBar";
import { ResourceList } from "@/components/resource/ResourceList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function PromptsPage() {
  const { items } = await listContents({ type: "prompt", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="Prompt 列表"
      subtitle="低保真块：页内搜索 + 左侧排序筛选 + 卡片区 + 分页"
      filterSlot={<FilterBar typeLabel="Prompt" />}
      listSlot={<ResourceList items={items} />}
      paginationSlot={<p className="text-sm text-slate-500">分页 UI 占位（offset/limit/total）</p>}
    />
  );
}
