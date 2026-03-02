// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminTagsPage() {
  return (
    <PageShell title="标签管理" subtitle="低保真块：标签 CRUD">
      <SectionCard title="标签列表">
        <Placeholder title="标签列表占位" />
      </SectionCard>
      <SectionCard title="操作区">
        <Placeholder title="CRUD 占位" todos={["新增", "编辑", "删除"]} />
      </SectionCard>
    </PageShell>
  );
}
