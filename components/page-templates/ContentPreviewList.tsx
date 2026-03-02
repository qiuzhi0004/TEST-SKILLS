import type { ContentSummaryVM } from "@/types/content";

interface ContentPreviewListProps {
  items: ContentSummaryVM[];
}

export function ContentPreviewList({ items }: ContentPreviewListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">暂无数据</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-600">{item.one_liner ?? "暂无简介"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.type} · {item.status} · {item.id}
          </p>
        </li>
      ))}
    </ul>
  );
}
