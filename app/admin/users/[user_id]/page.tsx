// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

interface AdminUserDetailPageProps {
  params: Promise<{ user_id: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { user_id } = await params;

  return (
    <PageShell title={`用户详情：${user_id}`} subtitle="低保真块：角色/封禁/受限动作/踢下线">
      <SectionCard title="用户信息">
        <Placeholder title="用户资料占位" />
      </SectionCard>
      <SectionCard title="管理动作">
        <Placeholder title="动作占位" todos={["角色调整", "封禁", "受限动作", "踢下线"]} />
      </SectionCard>
    </PageShell>
  );
}
