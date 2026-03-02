// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function MePublishedPage() {
  return (
    <PageShell title="个人中心 - 发布内容" subtitle="低保真块：类型导航 + 状态筛选 + 发布卡片流">
      <SectionCard title="类型导航与筛选">
        <Placeholder
          title="发布列表筛选占位"
          todos={[
            "类型切换 Prompt/Skill/MCP/教程",
            "status 筛选",
            "q 搜索",
            "sort/order",
          ]}
        />
      </SectionCard>
      <SectionCard title="发布列表与操作">
        <Placeholder title="发布卡片流占位" todos={["编辑", "提交审核", "上架/下架", "删除"]} />
      </SectionCard>
    </PageShell>
  );
}
