import { FilterBar } from "@/components/resource/FilterBar";
import { ResourceList } from "@/components/resource/ResourceList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function TutorialsPage() {
  const { items } = await listContents({ type: "tutorial", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="教程列表"
      subtitle="低保真块：列表骨架占位"
      filterSlot={<FilterBar typeLabel="教程" />}
      listSlot={<ResourceList items={items} />}
      paginationSlot={<p className="text-sm text-slate-500">分页 UI 占位（offset/limit/total）</p>}
    />
  );
}
