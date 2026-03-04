// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

  const total = useMemo(
    () => stats.pending + stats.approved + stats.reject + stats.listed + stats.unlisted,
    [stats],
  );

  return (
    <PageShell title="管理后台首页" subtitle="审核与运营总览" metaText="基于本地 mock 数据实时汇总" accent="#2563EB">
      <SectionCard title="审核概览">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="text-xs">待审</p>
            <p className="mt-1 text-xl font-semibold">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="text-xs">已通过</p>
            <p className="mt-1 text-xl font-semibold">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="text-xs">已驳回</p>
            <p className="mt-1 text-xl font-semibold">{stats.reject}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            <p className="text-xs">已上架</p>
            <p className="mt-1 text-xl font-semibold">{stats.listed}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs">已下架</p>
            <p className="mt-1 text-xl font-semibold">{stats.unlisted}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          当前累计审核样本：{total}
        </div>
      </SectionCard>

      <SectionCard title="快捷入口">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/moderation/cases" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            内容审核队列
          </Link>
          <Link href="/admin/users" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            用户管理
          </Link>
          <Link href="/admin/role-permissions" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            权限矩阵
          </Link>
          <Link href="/admin/audit-logs" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            审计日志
          </Link>
        </div>
      </SectionCard>
    </PageShell>
  );
}
