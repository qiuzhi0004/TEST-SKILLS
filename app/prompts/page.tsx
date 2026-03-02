import { Placeholder } from "@/components/layout/Placeholder";
import { ContentPreviewList } from "@/components/page-templates/ContentPreviewList";
import { ListPageTemplate } from "@/components/page-templates/ListPageTemplate";
import { listContents } from "@/lib/api";

export default async function PromptsPage() {
  const { items } = await listContents({ type: "prompt", offset: 0, limit: 8 });

  return (
    <ListPageTemplate
      title="Prompt 列表"
      subtitle="低保真块：页内搜索 + 左侧排序筛选 + 卡片区 + 分页"
      filterSlot={
        <div className="space-y-3">
          <div className="grid gap-2 text-sm text-slate-600">
            <label>关键词搜索（占位）</label>
            <input className="rounded border border-slate-300 px-2 py-1" placeholder="输入 q" disabled />
            <label>排序（占位）</label>
            <select className="rounded border border-slate-300 px-2 py-1" disabled>
              <option>hot_score desc</option>
            </select>
          </div>
          <Placeholder
            title="筛选逻辑待实现"
            todos={["tag_ids 多选", "source 过滤", "搜索高亮"]}
          />
        </div>
      }
      listSlot={<ContentPreviewList items={items} />}
      paginationSlot={<Placeholder title="分页占位" description="offset/limit/total UI 占位，暂不绑定交互。" />}
    />
  );
}
