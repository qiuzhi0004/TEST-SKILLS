// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { listReviewQueue } from '@/lib/api/admin_review';

interface Stats {
  pending: number;
  approved: number;
  reject: number;
  listed: number;
  unlisted: number;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, reject: 0, listed: 0, unlisted: 0 });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await listReviewQueue({ type: 'all', offset: 0, limit: 1000 });
      if (cancelled) return;
      const next: Stats = { pending: 0, approved: 0, reject: 0, listed: 0, unlisted: 0 };
      for (const item of res.items) {
        if (item.status === 'PendingReview') next.pending += 1;
        if (item.status === 'Approved') next.approved += 1;
        if (item.status === 'Reject') next.reject += 1;
        if (item.status === 'Listed') next.listed += 1;
        if (item.status === 'Unlisted') next.unlisted += 1;
      }
      setStats(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell title="管理后台首页" subtitle="最小审核/运营控制台概览">
      <SectionCard title="审核概览">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">待审: {stats.pending}</div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">已通过: {stats.approved}</div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">已驳回: {stats.reject}</div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">已上架: {stats.listed}</div>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">已下架: {stats.unlisted}</div>
        </div>
      </SectionCard>
      <SectionCard title="入口说明">
        <p className="text-sm text-slate-600">核心审核入口：/admin/moderation/cases</p>
      </SectionCard>
    </PageShell>
  );
}
