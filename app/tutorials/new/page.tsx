// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

export default function TutorialCreatePage() {
  return (
    <FormPageTemplate
      title="教程创建"
      subtitle="低保真块：创建页结构占位"
      formSlot={<Placeholder title="教程表单占位" todos={["title/category_ids/tag_ids", "body_markdown", "media"]} />}
      sideSlot={<Placeholder title="校验提示占位" />}
      actionSlot={<Placeholder title="动作按钮占位" />}
    />
  );
}
