import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import type { ContentStatus, ContentSummaryVM, ContentType } from '@/types/content';

interface ResourceCardProps {
  item: ContentSummaryVM;
  maxTags?: number;
  showStatus?: boolean;
}

function getDetailPath(type: ContentType, id: string): string {
  if (type === 'prompt') return `/prompts/${id}`;
  if (type === 'mcp') return `/mcps/${id}`;
  if (type === 'skill') return `/skills/${id}`;
  return `/tutorials/${id}`;
}

function statusTone(status: ContentStatus) {
  if (status === 'Listed') return 'success' as const;
  if (status === 'PendingReview' || status === 'Approved') return 'info' as const;
  if (status === 'Reject' || status === 'Deleted') return 'danger' as const;
  if (status === 'Unlisted') return 'warn' as const;
  return 'muted' as const;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('zh-CN');
}

export function ResourceCard({ item, maxTags = 4, showStatus = true }: ResourceCardProps) {
  const href = getDetailPath(item.type, item.id);
  const tags = item.tag_ids.slice(0, maxTags);

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">{item.title}</p>
          <p className="line-clamp-2 text-xs text-slate-600">{item.one_liner ?? '暂无简介'}</p>
        </div>
        <Badge tone="muted">{item.type.toUpperCase()}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tagId) => (
          <Badge key={tagId} tone="info">
            #{tagId}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>作者：{item.author.nickname}</span>
        <span>更新：{formatDate(item.updated_at)}</span>
      </div>

      {showStatus ? (
        <div className="mt-2">
          <Badge tone={statusTone(item.status)}>{item.status}</Badge>
        </div>
      ) : null}
    </Link>
  );
}
