'use client';

import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Table } from '@/components/ui/Table';
import { ReviewActions } from '@/components/admin/ReviewActions';
import type { ContentSummaryVM } from '@/types/content';

interface ReviewTableProps {
  items: ContentSummaryVM[];
  onRefresh: () => void;
}

export function ReviewTable({ items, onRefresh }: ReviewTableProps) {
  if (items.length === 0) {
    return <EmptyState title="暂无记录" description="当前筛选条件下没有匹配内容。" />;
  }

  return (
    <Table
      head={(
        <tr>
          <th className="px-3 py-2">标题</th>
          <th className="px-3 py-2">类型/状态</th>
          <th className="px-3 py-2">更新时间</th>
          <th className="px-3 py-2">操作</th>
        </tr>
      )}
      body={items.map((item) => (
        <tr key={`${item.type}:${item.id}`} className="border-t border-slate-100 align-top">
          <td className="px-3 py-2">
            <Link href={`/admin/moderation/cases/${encodeURIComponent(`${item.type}:${item.id}`)}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              {item.title}
            </Link>
            <p className="text-xs text-slate-500">{item.id}</p>
          </td>
          <td className="px-3 py-2">
            <p className="text-xs text-slate-600">{item.type}</p>
            <div className="mt-1"><Badge tone="info">{item.status}</Badge></div>
          </td>
          <td className="px-3 py-2 text-xs text-slate-500">{item.updated_at}</td>
          <td className="px-3 py-2">
            <ReviewActions type={item.type} id={item.id} status={item.status} onDone={onRefresh} />
          </td>
        </tr>
      ))}
    />
  );
}
