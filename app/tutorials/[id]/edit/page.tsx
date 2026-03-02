// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

interface TutorialEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorialEditPage({ params }: TutorialEditPageProps) {
  const { id } = await params;

  return (
    <FormPageTemplate
      title={`教程编辑：${id}`}
      subtitle="低保真块：编辑页结构占位"
      formSlot={<Placeholder title="编辑表单占位" todos={["正文编辑", "媒体管理"]} />}
      sideSlot={<Placeholder title="状态提示占位" />}
      actionSlot={<Placeholder title="动作区占位" />}
    />
  );
}
