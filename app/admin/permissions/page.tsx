// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminPermissionsPage() {
  return (
    <PageShell title="权限管理" subtitle="低保真块：权限 CRUD">
      <SectionCard title="权限列表">
        <Placeholder title="权限表格占位" />
      </SectionCard>
      <SectionCard title="权限操作">
        <Placeholder title="CRUD 占位" />
      </SectionCard>
    </PageShell>
  );
}
