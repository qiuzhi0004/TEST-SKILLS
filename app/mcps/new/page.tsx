// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

export default function McpCreatePage() {
  return (
    <FormPageTemplate
      title="MCP 创建"
      subtitle="低保真块：MCP 表单占位"
      formSlot={<Placeholder title="MCP 表单占位" todos={["basic 字段", "cases>=1", "how_to_use 三段文本"]} />}
      sideSlot={<Placeholder title="发布校验占位" todos={["json_config_text 必填", "cases 必填"]} />}
      actionSlot={<Placeholder title="动作按钮占位" />}
    />
  );
}
