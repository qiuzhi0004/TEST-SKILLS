import { ResourceCard } from '@/components/resource/ResourceCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ContentSummaryVM } from '@/types/content';

interface ResourceListProps {
  items: ContentSummaryVM[];
  showStatus?: boolean;
  onlyListed?: boolean;
}

export function ResourceList({ items, showStatus = false, onlyListed = true }: ResourceListProps) {
  const visibleItems = onlyListed ? items.filter((item) => item.status === 'Listed') : items;

  if (visibleItems.length === 0) {
    return <EmptyState title="暂无内容" description="请稍后重试，或切换到其他资源类型。" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visibleItems.map((item) => (
        <ResourceCard key={item.id} item={item} showStatus={showStatus} />
      ))}
    </div>
  );
}
