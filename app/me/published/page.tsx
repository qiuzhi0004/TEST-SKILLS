// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { MyRecordsPanel } from "@/components/forms/authoring/MyRecordsPanel";
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
        <MyRecordsPanel />
      </SectionCard>
      <SectionCard title="说明">
        <Placeholder
          title="本地作者工作区"
          description="本阶段 records 存在 localStorage，后续替换为服务端接口。"
          todos={["审核流后台处理后续实现", "列表筛选联动后续实现"]}
        />
      </SectionCard>
    </PageShell>
  );
}
