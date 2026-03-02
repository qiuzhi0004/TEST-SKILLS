import { Placeholder } from "@/components/layout/Placeholder";
import { TabNav } from "@/components/layout/TabNav";
import { DetailPageTemplate } from "@/components/page-templates/DetailPageTemplate";
import { getTutorial } from "@/lib/api";

interface TutorialDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorialDetailPage({ params }: TutorialDetailPageProps) {
  const { id } = await params;
  let detail = null;

  try {
    detail = await getTutorial(id);
  } catch {
    detail = null;
  }

  return (
    <DetailPageTemplate
      title={detail?.content.title ?? `教程详情（未找到：${id}）`}
      subtitle="低保真块：正文 + Media + 评论"
      tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "Content" }, { label: "Media" }]} />}
      sections={[
        {
          title: "正文",
          content: (
            <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">
              {detail?.body_markdown ?? "暂无正文"}
            </pre>
          ),
        },
        {
          title: "媒体区",
          content: (
            <div className="space-y-2 text-sm text-slate-700">
              <p>媒体数量：{detail?.media.length ?? 0}</p>
              <Placeholder title="媒体画廊占位" />
            </div>
          ),
        },
      ]}
      metaSlot={<Placeholder title="右侧元信息占位" />}
      commentsSlot={<Placeholder title="评论区占位" />}
    />
  );
}
