// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { AuditLogExplorer } from '@/components/admin/AuditLogExplorer';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';

export default function AdminAuditLogsPage() {
  return (
    <PageShell
      title="审计日志"
      subtitle="关键动作留痕与追溯"
      metaText="支持动作类型、对象、操作人、时间区间过滤与导出"
      badge="Audit Trail"
      accent="#BE123C"
    >
      <SectionCard title="审计检索" description="每次审核动作（approve/reject/list/unlist/rollback）都会写入本地审计日志。">
        <AuditLogExplorer />
      </SectionCard>
    </PageShell>
  );
}
