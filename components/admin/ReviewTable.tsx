'use client';

import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { ReviewActions } from '@/components/admin/ReviewActions';
import type { ContentSummaryVM } from '@/types/content';

interface ReviewTableProps {
  items: ContentSummaryVM[];
  onRefresh: () => void;
}

export function ReviewTable({ items, onRefresh }: ReviewTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">当前筛选条件下暂无记录</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.type}:${item.id}`} className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Link href={`/admin/moderation/cases/${encodeURIComponent(`${item.type}:${item.id}`)}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
                {item.title}
              </Link>
              <p className="text-xs text-slate-600">{item.type} · {item.id}</p>
              <p className="text-xs text-slate-500">updated_at: {item.updated_at}</p>
            </div>
            <Badge tone="info">{item.status}</Badge>
          </div>
          <div className="mt-3">
            <ReviewActions type={item.type} id={item.id} status={item.status} onDone={onRefresh} />
          </div>
        </div>
      ))}
    </div>
  );
}
