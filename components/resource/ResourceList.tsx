import { ResourceCard } from '@/components/resource/ResourceCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ContentSummaryVM } from '@/types/content';

interface ResourceListProps {
  items: ContentSummaryVM[];
}

export function ResourceList({ items }: ResourceListProps) {
  if (items.length === 0) {
    return <EmptyState title="暂无内容" description="请稍后重试，或切换到其他资源类型。" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ResourceCard key={item.id} item={item} />
      ))}
    </div>
  );
}
