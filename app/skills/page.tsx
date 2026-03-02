import { Placeholder } from "@/components/layout/Placeholder";
import { ContentPreviewList } from "@/components/page-templates/ContentPreviewList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function SkillsPage() {
  const { items } = await listContents({ type: "skill", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="Skill 列表"
      subtitle="低保真块：搜索/排序/筛选 + 卡片流"
      filterSlot={
        <div className="space-y-3">
          <Placeholder
            title="筛选区占位"
            todos={["q 搜索", "tag_ids 多选", "source=official|user", "sort/order"]}
          />
        </div>
      }
      listSlot={<ContentPreviewList items={items} />}
      paginationSlot={<Placeholder title="分页占位" />}
    />
  );
}
