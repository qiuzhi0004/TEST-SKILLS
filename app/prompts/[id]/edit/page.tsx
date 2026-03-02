// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

interface PromptEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptEditPage({ params }: PromptEditPageProps) {
  const { id } = await params;

  return (
    <FormPageTemplate
      title={`Prompt 编辑：${id}`}
      subtitle="低保真块：编辑页结构占位"
      formSlot={<Placeholder title="编辑表单占位" todos={["加载详情", "变更标记", "保存后状态流转"]} />}
      sideSlot={<Placeholder title="编辑右栏占位" todos={["当前状态", "校验提示", "历史保存"]} />}
      actionSlot={<Placeholder title="编辑动作占位" todos={["保存", "提交审核", "上架/下架", "删除"]} />}
    />
  );
}
