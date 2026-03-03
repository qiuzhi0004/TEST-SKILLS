'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { toDisplayTags } from '@/lib/tagDisplay';
import { listMyRecords } from '@/lib/api/authoring';
import type { AuthoringRecord } from '@/types/authoring';
import type { ContentType } from '@/types/content';

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

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const displayTags = toDisplayTags(item.data.content.tag_ids, 3);
        return (
          <li key={`${item.type}:${item.id}`} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.data.content.title}</p>
                <p className="text-xs text-slate-500">{item.type} · {item.id}</p>
              </div>
              <Badge tone="info">{item.status}</Badge>
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
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">updated_at: {item.updated_at}</span>
              <Link href={editPath(item.type, item.id)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700">
                继续编辑
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
