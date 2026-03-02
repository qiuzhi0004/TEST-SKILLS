import { Placeholder } from "@/components/layout/Placeholder";
import { ContentPreviewList } from "@/components/page-templates/ContentPreviewList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function TutorialsPage() {
  const { items } = await listContents({ type: "tutorial", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="教程列表"
      subtitle="低保真块：列表骨架占位"
      filterSlot={<Placeholder title="筛选区占位" todos={["q", "tag_ids", "sort/order"]} />}
      listSlot={<ContentPreviewList items={items} />}
      paginationSlot={<Placeholder title="分页区占位" />}
    />
  );
}
