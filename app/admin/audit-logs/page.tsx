// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';

export default function AdminAuditLogsPage() {
  return (
    <PageShell title="审计日志" subtitle="本地审计日志（倒序）">
      <SectionCard title="日志列表">
        <AuditLogPanel />
      </SectionCard>
      <SectionCard title="说明">
        <p className="text-sm text-slate-600">每次审核动作（approve/reject/list/unlist/rollback）都会写入本地审计日志。</p>
      </SectionCard>
    </PageShell>
  );
}
