// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

interface AdminModerationCaseDetailPageProps {
  params: Promise<{ case_id: string }>;
}

export default async function AdminModerationCaseDetailPage({ params }: AdminModerationCaseDetailPageProps) {
  const { case_id } = await params;

  return (
    <PageShell title={`审核详情：${case_id}`} subtitle="低保真块：case 详情 + 审核动作">
      <SectionCard title="Case 详情">
        <Placeholder title="审核上下文占位" todos={["内容快照", "原因", "历史记录"]} />
      </SectionCard>
      <SectionCard title="审核动作">
        <Placeholder title="动作占位" todos={["approve", "reject(含理由)"]} />
      </SectionCard>
    </PageShell>
  );
}
