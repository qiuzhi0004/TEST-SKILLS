import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/common/Badge';
import { toDisplayTags } from '@/lib/tagDisplay';
import { resolveCoverSrc } from '@/lib/visualAssets';
import type { ContentStatus, ContentSummaryVM, ContentType } from '@/types/content';

interface ResourceCardProps {
  item: ContentSummaryVM;
  maxTags?: number;
  showStatus?: boolean;
  showTypeBadge?: boolean;
  hidePromptMediaTags?: boolean;
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

export function ResourceCard({
  item,
  maxTags = 3,
  showStatus = false,
  showTypeBadge = true,
  hidePromptMediaTags = false,
}: ResourceCardProps) {
  const href = getDetailPath(item.type, item.id);
  const coverSrc = resolveCoverSrc({ assetId: item.cover_asset_id, seed: `${item.type}:${item.id}`, type: item.type });
  const tags = toDisplayTags(item.tag_ids, maxTags).filter((tag) =>
    hidePromptMediaTags ? !['prompt_text', 'prompt_image', 'prompt_video'].includes(tag.id) : true,
  );
  const upCount = item.stats_7d.up;
  const favoriteCount = 0;

  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#f2bea7] hover:shadow-[0_10px_20px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2bea7] focus-visible:ring-offset-1"
    >
      <div className="relative h-32 w-full overflow-hidden bg-slate-100">
        <Image
          src={coverSrc}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3">
          {showTypeBadge ? (
            <span className="inline-flex items-center rounded-full border border-white/55 bg-white/80 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-700">
              {item.type.toUpperCase()}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 break-words text-sm font-semibold text-slate-900 group-hover:text-[#e95a1d]">
              {item.title}
            </p>
            <p className="line-clamp-2 break-words text-xs text-slate-600">{item.one_liner ?? '暂无简介'}</p>
          </div>
        </div>

        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.id} tone="info">
                {tag.label}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>点赞：{upCount}</span>
          <span>收藏：{favoriteCount}</span>
        </div>

        <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>作者：{item.author.nickname}</span>
          <span>更新：{formatDate(item.updated_at)}</span>
        </div>

        {showStatus ? (
          <div className="mt-2">
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
