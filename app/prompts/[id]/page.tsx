import { Placeholder } from "@/components/layout/Placeholder";
import { TabNav } from "@/components/layout/TabNav";
import { DetailPageTemplate } from "@/components/page-templates/DetailPageTemplate";
import { getPrompt } from "@/lib/api";

interface PromptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;
  let detail = null;

  try {
    detail = await getPrompt(id);
  } catch {
    detail = null;
  }

  return (
    <DetailPageTemplate
      title={detail?.content.title ?? `Prompt 详情（未找到：${id}）`}
      subtitle="低保真块：首屏信息 + Tabs + 右侧元信息 + 评论置底"
      tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "Content" }, { label: "Showcase" }]} />}
      sections={[
        {
          title: "首屏信息",
          content: (
            <div className="space-y-1 text-sm text-slate-700">
              <p>ID: {detail?.content.id ?? id}</p>
              <p>状态: {detail?.content.status ?? "N/A"}</p>
              <p>模型: {detail?.model_name ?? "N/A"}</p>
              <p>语言: {detail?.language ?? "N/A"}</p>
            </div>
          ),
        },
        {
          title: "Prompt 本体",
          content: (
            <div className="space-y-3">
              <pre className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">
                {detail?.prompt_text ?? "暂无内容"}
              </pre>
              <Placeholder title="Tabs 细节待实现" todos={["Overview 字段编排", "Showcase 媒体展示"]} />
            </div>
          ),
        },
      ]}
      metaSlot={<Placeholder title="轻动作占位" todos={["点赞", "收藏", "分享"]} />}
      commentsSlot={<Placeholder title="评论区占位" todos={["评论树", "发评论", "删除评论"]} />}
    />
  );
}
