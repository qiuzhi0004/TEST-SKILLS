// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminAuditLogsPage() {
  return (
    <PageShell title="审计日志" subtitle="低保真块：audit logs 查询">
      <SectionCard title="查询条件">
        <Placeholder title="审计筛选占位" todos={["action_type", "target_type", "target_id", "actor", "时间范围"]} />
      </SectionCard>
      <SectionCard title="日志列表">
        <Placeholder title="审计表格占位" />
      </SectionCard>
    </PageShell>
  );
}
