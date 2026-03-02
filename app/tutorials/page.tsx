'use client';

import { useEffect, useState } from 'react';
import { FilterBar } from '@/components/resource/FilterBar';
import { ResourceList } from '@/components/resource/ResourceList';
import { ListPageTemplate } from '@/components/page-templates/ListPageTemplate';
import { listContents } from '@/lib/api';
import type { ContentSummaryVM } from '@/types/content';

export default function TutorialsPage() {
  const [items, setItems] = useState<ContentSummaryVM[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listContents({ type: 'tutorial', offset: 0, limit: 50 }).then((res) => {
      if (!cancelled) setItems(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ListPageTemplate
      title="教程列表"
      subtitle="低保真块：列表骨架占位"
      filterSlot={<FilterBar typeLabel="教程" />}
      listSlot={<ResourceList items={items} />}
      paginationSlot={<p className="text-sm text-slate-500">分页 UI 占位（offset/limit/total）</p>}
    />
  );
}
