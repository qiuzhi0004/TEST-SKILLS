// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminCategoriesPage() {
  return (
    <PageShell title="分类管理" subtitle="低保真块：分类 CRUD">
      <SectionCard title="分类树">
        <Placeholder title="分类树占位" todos={["树形展示", "展开/折叠"]} />
      </SectionCard>
      <SectionCard title="操作区">
        <Placeholder title="CRUD 占位" todos={["新增", "编辑", "删除"]} />
      </SectionCard>
    </PageShell>
  );
}
