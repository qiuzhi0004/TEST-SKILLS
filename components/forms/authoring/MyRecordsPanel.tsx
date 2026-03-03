'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { toDisplayTags } from '@/lib/tagDisplay';
import { listMyRecords } from '@/lib/api/authoring';
import type { AuthoringRecord } from '@/types/authoring';
import type { ContentStatus, ContentType } from '@/types/content';

function editPath(type: ContentType, id: string) {
  if (type === 'prompt') return `/prompts/${id}/edit`;
  if (type === 'mcp') return `/mcps/${id}/edit`;
  if (type === 'skill') return `/skills/${id}/edit`;
  return `/tutorials/${id}/edit`;
}

export function MyRecordsPanel() {
  const [items, setItems] = useState<AuthoringRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listMyRecords().then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">暂无本地发布记录</p>;
  }

  const statusLabelMap: Record<ContentStatus, string> = {
    Draft: '草稿',
    PendingReview: '待审核',
    Reject: '已拒绝',
    Approved: '已通过',
    Listed: '已上架',
    Unlisted: '已下架',
    Deleted: '已删除',
  };

  const typeLabelMap: Record<ContentType, string> = {
    prompt: 'Prompt',
    skill: 'Skill',
    mcp: 'MCP',
    tutorial: '教程',
  };

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const displayTags = toDisplayTags(item.data.content.tag_ids, 3);
        return (
          <li key={`${item.type}:${item.id}`} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.data.content.title}</p>
                <p className="text-xs text-slate-500">{typeLabelMap[item.type]} · {item.id}</p>
              </div>
              <Badge tone="muted">{typeLabelMap[item.type]}</Badge>
            </div>
            {displayTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <Badge key={tag.id} tone="muted">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-auto pt-3">
              <div className="mb-2">
                <Badge tone="info">{statusLabelMap[item.status]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">更新：{new Date(item.updated_at).toLocaleDateString('zh-CN')}</span>
                <Link href={editPath(item.type, item.id)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
                  继续编辑
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
