import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

interface DetailSection {
  title: string;
  description?: string;
  content: ReactNode;
}

interface DetailPageTemplateProps {
  title: string;
  subtitle?: string;
  bannerSlot?: ReactNode;
  metaSlot?: ReactNode;
  tabsSlot?: ReactNode;
  sections: DetailSection[];
  commentsSlot?: ReactNode;
}

export function DetailPageTemplate({
  title,
  subtitle,
  bannerSlot,
  metaSlot,
  tabsSlot,
  sections,
  commentsSlot,
}: DetailPageTemplateProps) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      {bannerSlot ? <div>{bannerSlot}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {tabsSlot}
          {sections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              description={section.description}
            >
              {section.content}
            </SectionCard>
          ))}
          {commentsSlot ? (
            <SectionCard title="评论区">{commentsSlot}</SectionCard>
          ) : null}
        </div>
        <div className="space-y-4">
          <SectionCard title="右侧元信息栏">
            {metaSlot ?? <p className="text-sm text-slate-500">元信息占位</p>}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
