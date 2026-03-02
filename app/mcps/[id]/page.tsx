import { Placeholder } from "@/components/layout/Placeholder";
import { TabNav } from "@/components/layout/TabNav";
import { DetailPageTemplate } from "@/components/page-templates/DetailPageTemplate";
import { getMcp } from "@/lib/api";

interface McpDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function McpDetailPage({ params }: McpDetailPageProps) {
  const { id } = await params;
  let detail = null;

  try {
    detail = await getMcp(id);
  } catch {
    detail = null;
  }

  return (
    <DetailPageTemplate
      title={detail?.content.title ?? `MCP 详情（未找到：${id}）`}
      subtitle="低保真块：HowTo + Cases + 右侧元信息"
      tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "HowTo" }, { label: "Cases" }]} />}
      sections={[
        {
          title: "基础信息",
          content: (
            <div className="space-y-1 text-sm text-slate-700">
              <p>Provider: {detail?.provider_name ?? "N/A"}</p>
              <p>Source: {detail?.source ?? "N/A"}</p>
              <p>Repo URL: {detail?.repo_url ?? "N/A"}</p>
            </div>
          ),
        },
        {
          title: "How To Use",
          content: (
            <div className="space-y-2">
              <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                {detail?.how_to_use.json_config_text ?? ""}
              </pre>
              <Placeholder title="三段文本展示占位" todos={["common_clients_json", "runtime_modes_json"]} />
            </div>
          ),
        },
      ]}
      metaSlot={<Placeholder title="右侧动作占位" />}
      commentsSlot={<Placeholder title="评论区占位" />}
    />
  );
}
