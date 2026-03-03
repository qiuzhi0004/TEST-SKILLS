import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

interface FormPageTemplateProps {
  title: string;
  subtitle?: string;
  formSlot: ReactNode;
  sideSlot?: ReactNode;
  actionSlot?: ReactNode;
  hideActionTitle?: boolean;
}

export function FormPageTemplate({
  title,
  subtitle,
  formSlot,
  sideSlot,
  actionSlot,
  hideActionTitle = false,
}: FormPageTemplateProps) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <SectionCard title="表单主体">{formSlot}</SectionCard>
        <SectionCard title="右侧信息栏">
          {sideSlot ?? <p className="text-sm text-slate-500">状态/校验提示占位</p>}
        </SectionCard>
      </div>
      {hideActionTitle ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {actionSlot ?? <p className="text-sm text-slate-500">保存 / 提交审核 / 上下架 / 删除（占位）</p>}
        </section>
      ) : (
        <SectionCard title="底部按钮区">
          {actionSlot ?? <p className="text-sm text-slate-500">保存 / 提交审核 / 上下架 / 删除（占位）</p>}
        </SectionCard>
      )}
    </PageShell>
  );
}
