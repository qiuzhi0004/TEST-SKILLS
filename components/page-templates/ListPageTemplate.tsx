import type { ReactNode } from "react";
import { InlineNotice } from "@/components/feedback/InlineNotice";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

interface ListPageTemplateProps {
  title: string;
  subtitle?: string;
  filterSlot: ReactNode;
  listSlot: ReactNode;
  paginationSlot?: ReactNode;
}

export function ListPageTemplate({
  title,
  subtitle,
  filterSlot,
  listSlot,
  paginationSlot,
}: ListPageTemplateProps) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <SectionCard title="筛选与排序">{filterSlot}</SectionCard>
        <SectionCard title="内容列表">{listSlot}</SectionCard>
      </div>
      <SectionCard title="分页区">
        {paginationSlot ?? <InlineNotice title="分页控件占位" description="后续补齐 offset/limit 翻页交互。" tone="warn" />}
      </SectionCard>
    </PageShell>
  );
}
