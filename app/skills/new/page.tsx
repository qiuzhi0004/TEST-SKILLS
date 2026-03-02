// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

export default function SkillCreatePage() {
  return (
    <FormPageTemplate
      title="Skill 创建"
      subtitle="低保真块：Skill 发布表单占位"
      formSlot={<Placeholder title="Skill 表单占位" todos={["base 字段", "cases", "install_commands", "usage_doc", "zip_asset_id"]} />}
      sideSlot={<Placeholder title="发布校验占位" todos={["repo_url 为空时 usage_doc 必填", "zip 必填"]} />}
      actionSlot={<Placeholder title="动作按钮占位" />}
    />
  );
}
