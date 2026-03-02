import { Badge } from "@/components/common/Badge";
import { CodeBlock } from "@/components/common/CodeBlock";
import { Placeholder } from "@/components/layout/Placeholder";
import { TabNav } from "@/components/layout/TabNav";
import { DetailPageTemplate } from "@/components/page-templates/DetailPageTemplate";
import { CommentThread } from "@/components/social/CommentThread";
import { SocialBar } from "@/components/social/SocialBar";
import { getMcp } from "@/lib/api";

interface McpDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function McpDetailPage({ params }: McpDetailPageProps) {
  const { id } = await params;
  const target = { target_type: "mcp" as const, target_id: id };
  let detail = null;

  try {
    detail = await getMcp(id);
  } catch {
    detail = null;
  }

  if (!detail) {
    return (
      <DetailPageTemplate
        title={`MCP 详情（未找到：${id}）`}
        subtitle="未找到对应 mock 数据"
        tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "HowTo" }, { label: "Cases" }]} />}
        sections={[
          {
            title: "空状态",
            content: <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />,
          },
          {
            title: "后续功能",
            content: <Placeholder title="详情交互占位" todos={["评论", "收藏", "分享"]} />,
          },
        ]}
      />
    );
  }

  return (
    <DetailPageTemplate
      title={detail.content.title}
      subtitle="低保真块：HowTo + Cases + 右侧元信息"
      tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "HowTo" }, { label: "Cases" }]} />}
      sections={[
        {
          title: "基础信息",
          content: (
            <div className="space-y-3 text-sm text-slate-700">
              <p className="text-slate-600">{detail.content.one_liner ?? "暂无描述"}</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.content.tag_ids.map((tagId) => (
                  <Badge key={tagId} tone="info">
                    #{tagId}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>provider: {detail.provider_name}</span>
                <span>source: {detail.source}</span>
                <span>repo: {detail.repo_url}</span>
              </div>
            </div>
          ),
        },
        {
          title: "如何使用",
          content: (
            <div className="space-y-3">
              {/* NOTE(decision-4): 严格按字段文档要求，以三段原样文本展示，不在前端解析为 object。 */}
              <CodeBlock title="标准配置（json_config_text）" value={detail.how_to_use.json_config_text} />
              <CodeBlock title="常用客户端（common_clients_json）" value={detail.how_to_use.common_clients_json} />
              <CodeBlock title="运行形态（runtime_modes_json）" value={detail.how_to_use.runtime_modes_json} />
              <Placeholder title="Cases 展示占位" todos={["案例列表", "案例媒体画廊"]} />
            </div>
          ),
        },
      ]}
      metaSlot={<SocialBar target={target} />}
      commentsSlot={<CommentThread target={target} />}
    />
  );
}
