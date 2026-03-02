import { ResourceCard } from '@/components/resource/ResourceCard';
import type { ContentSummaryVM } from '@/types/content';

interface ResourceListProps {
  items: ContentSummaryVM[];
}

export function ResourceList({ items }: ResourceListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">暂无内容</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ResourceCard key={item.id} item={item} />
      ))}
    </div>
  );
}
