// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { FormPageTemplate } from "@/components/page-templates/FormPageTemplate";

export default function PromptCreatePage() {
  return (
    <FormPageTemplate
      title="Prompt 创建"
      subtitle="低保真块：表单主体 + 右侧提示 + 底部按钮区"
      formSlot={
        <div className="space-y-3">
          <Placeholder
            title="Prompt 表单占位"
            todos={[
              "title/category_ids/tag_ids",
              "model_name/language/prompt_text",
              "showcases 至少 1 组",
            ]}
          />
          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-2 py-1" placeholder="标题" disabled />
            <input className="rounded border border-slate-300 px-2 py-1" placeholder="模型" disabled />
          </div>
        </div>
      }
      sideSlot={<Placeholder title="状态与校验占位" todos={["字段级错误", "顶部汇总错误", "最近保存时间"]} />}
      actionSlot={<Placeholder title="动作按钮占位" todos={["保存", "提交审核", "上架", "下架", "删除"]} />}
    />
  );
}
