// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function AdminHomePage() {
  return (
    <PageShell title="管理后台首页" subtitle="低保真约定：默认跳内容审核（当前保留可见占位）">
      <SectionCard title="默认入口">
        <Placeholder title="默认跳转占位" todos={["后续可跳 /admin/moderation/cases"]} />
      </SectionCard>
      <SectionCard title="后台概览">
        <Placeholder title="后台概览占位" todos={["待审数", "最近事件", "系统提示"]} />
      </SectionCard>
    </PageShell>
  );
}
