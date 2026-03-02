// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminModerationCasesPage() {
  return (
    <PageShell title="内容审核列表" subtitle="低保真块：cases 列表 + 筛选">
      <SectionCard title="筛选区">
        <Placeholder title="审核筛选占位" todos={["status", "type", "q"]} />
      </SectionCard>
      <SectionCard title="审核列表">
        <Placeholder title="表格占位" todos={["查看详情", "审核动作入口"]} />
      </SectionCard>
    </PageShell>
  );
}
