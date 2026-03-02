// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminEventsPage() {
  return (
    <PageShell title="事件日志" subtitle="低保真块：events 查询">
      <SectionCard title="查询条件">
        <Placeholder title="日志筛选占位" todos={["event_type", "content_id", "actor", "时间范围"]} />
      </SectionCard>
      <SectionCard title="日志列表">
        <Placeholder title="事件表格占位" />
      </SectionCard>
    </PageShell>
  );
}
