// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { SideNav } from '@/components/layout/SideNav';
import { pickUnsplash } from '@/lib/visualAssets';

export const metadata: Metadata = {
  title: '后台控制台',
  description: '审核、审计与运营管理后台。',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 bg-[#f6f7f9] p-3 sm:p-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={pickUnsplash('admin:layout:hero', 'mcp')}
            alt="后台管理头图"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-blue-700/40" />
        </div>
        <div className="relative p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.12em] text-blue-100">Admin Console</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">后台管理</h1>
          <p className="mt-2 text-sm text-slate-200">统一管理审核队列、分类标签与审计日志。</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <SideNav
          title="管理导航"
          subtitle="审核、分类、日志"
          accent="#2563EB"
          items={[
            { label: '内容审核', href: '/admin/moderation/cases' },
            { label: '分类管理', href: '/admin/categories' },
            { label: '标签管理', href: '/admin/tags' },
            { label: '事件日志', href: '/admin/events' },
            { label: '审计日志', href: '/admin/audit-logs' },
          ]}
        />
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
