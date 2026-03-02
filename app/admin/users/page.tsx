// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminUsersPage() {
  return (
    <PageShell title="用户管理" subtitle="低保真块：用户列表 + 操作">
      <SectionCard title="用户筛选">
        <Placeholder title="筛选占位" todos={["关键词", "角色", "状态"]} />
      </SectionCard>
      <SectionCard title="用户列表">
        <Placeholder title="用户表格占位" todos={["进入用户详情", "批量操作"]} />
      </SectionCard>
    </PageShell>
  );
}
