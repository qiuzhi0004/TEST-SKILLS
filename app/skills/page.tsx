import { FilterBar } from "@/components/resource/FilterBar";
import { ResourceList } from "@/components/resource/ResourceList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function SkillsPage() {
  const { items } = await listContents({ type: "skill", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="Skill 列表"
      subtitle="低保真块：搜索/排序/筛选 + 卡片流"
      filterSlot={<FilterBar typeLabel="Skill" />}
      listSlot={<ResourceList items={items} />}
      paginationSlot={<p className="text-sm text-slate-500">分页 UI 占位（offset/limit/total）</p>}
    />
  );
}
