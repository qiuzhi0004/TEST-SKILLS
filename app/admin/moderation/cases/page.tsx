// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReviewFilters } from '@/components/admin/ReviewFilters';
import { ReviewTable } from '@/components/admin/ReviewTable';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { listReviewQueue } from '@/lib/api/admin_review';
import type { ContentStatus, ContentSummaryVM, ContentType } from '@/types/content';

export default function AdminModerationCasesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [type, setType] = useState<ContentType | 'all'>('all');
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [meta, setMeta] = useState({ offset: 0, limit: 20, total: 0 });

  const load = useCallback(async () => {
    const res = await listReviewQueue({
      q,
      status: status === 'all' ? undefined : status,
      type,
      offset: 0,
      limit: 50,
    });
    setItems(res.items);
    setMeta(res.meta);
  }, [q, status, type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [load]);

  return (
    <PageShell title="内容审核列表" subtitle="统一审核控制台（本地数据驱动）">
      <SectionCard title="筛选区">
        <ReviewFilters
          q={q}
          status={status}
          type={type}
          onQChange={setQ}
          onStatusChange={setStatus}
          onTypeChange={setType}
        />
      </SectionCard>
      <SectionCard title={`审核队列（total: ${meta.total}）`}>
        <ReviewTable items={items} onRefresh={() => void load()} />
      </SectionCard>
    </PageShell>
  );
}
