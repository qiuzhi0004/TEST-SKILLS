import { Placeholder } from "@/components/layout/Placeholder";
import { ContentPreviewList } from "@/components/page-templates/ContentPreviewList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function McpsPage() {
  const { items } = await listContents({ type: "mcp", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="MCP 列表"
      subtitle="低保真块：搜索/筛选/排序 + 卡片区"
      filterSlot={
        <Placeholder
          title="MCP 筛选占位"
          todos={["q 搜索", "tag_ids", "source", "sort/order", "highlight"]}
        />
      }
      listSlot={<ContentPreviewList items={items} />}
      paginationSlot={<Placeholder title="分页占位" />}
    />
  );
}
