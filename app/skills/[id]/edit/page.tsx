// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

interface SkillEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function SkillEditPage({ params }: SkillEditPageProps) {
  const { id } = await params;

  return (
    <FormPageTemplate
      title={`Skill 编辑：${id}`}
      subtitle="低保真块：编辑页结构占位"
      formSlot={<Placeholder title="编辑表单占位" todos={["详情回填", "cases 编辑", "how_to 字段补齐"]} />}
      sideSlot={<Placeholder title="状态区占位" todos={["当前状态", "冲突提示"]} />}
      actionSlot={<Placeholder title="动作区占位" />}
    />
  );
}
