// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminRolesPage() {
  return (
    <PageShell title="角色管理" subtitle="低保真块：角色 CRUD">
      <SectionCard title="角色列表">
        <Placeholder title="角色表格占位" />
      </SectionCard>
      <SectionCard title="角色操作">
        <Placeholder title="CRUD 占位" />
      </SectionCard>
    </PageShell>
  );
}
