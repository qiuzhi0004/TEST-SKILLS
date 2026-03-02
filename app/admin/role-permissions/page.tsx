// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminRolePermissionsPage() {
  return (
    <PageShell title="权限矩阵编辑" subtitle="低保真块：角色-权限矩阵">
      <SectionCard title="矩阵视图">
        <Placeholder title="矩阵占位" todos={["按角色维度", "按权限维度", "批量勾选"]} />
      </SectionCard>
      <SectionCard title="变更操作">
        <Placeholder title="保存与回滚占位" />
      </SectionCard>
    </PageShell>
  );
}
