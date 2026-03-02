// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

interface McpEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function McpEditPage({ params }: McpEditPageProps) {
  const { id } = await params;

  return (
    <FormPageTemplate
      title={`MCP 编辑：${id}`}
      subtitle="低保真块：编辑页结构占位"
      formSlot={<Placeholder title="编辑表单占位" todos={["详情回填", "HowTo 三段文本编辑", "cases 编辑"]} />}
      sideSlot={<Placeholder title="状态区占位" />}
      actionSlot={<Placeholder title="动作区占位" />}
    />
  );
}
