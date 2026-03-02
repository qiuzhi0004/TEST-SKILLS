import { Placeholder } from "@/components/layout/Placeholder";
import { TabNav } from "@/components/layout/TabNav";
import { DetailPageTemplate } from "@/components/page-templates/DetailPageTemplate";
import { getSkill } from "@/lib/api";

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { id } = await params;
  let detail = null;

  try {
    detail = await getSkill(id);
  } catch {
    detail = null;
  }

  return (
    <DetailPageTemplate
      title={detail?.content.title ?? `Skill 详情（未找到：${id}）`}
      subtitle="低保真块：详情主体 + 右侧元信息 + 评论区"
      tabsSlot={<TabNav items={[{ label: "Overview" }, { label: "Cases" }, { label: "Files" }]} />}
      sections={[
        {
          title: "基础信息",
          content: (
            <div className="space-y-1 text-sm text-slate-700">
              <p>Provider: {detail?.provider_name ?? "N/A"}</p>
              <p>Repo: {detail?.repo_url ?? "(none)"}</p>
              <p>Zip Asset: {detail?.zip_asset_id ?? "N/A"}</p>
            </div>
          ),
        },
        {
          title: "如何使用",
          content: (
            <div className="space-y-2 text-sm text-slate-700">
              <p>install_commands: {(detail?.install_commands ?? []).length}</p>
              <Placeholder title="安装与使用文档占位" todos={["命令复制", "usage_doc 展开", "zip 下载按钮"]} />
            </div>
          ),
        },
      ]}
      metaSlot={<Placeholder title="右侧动作占位" todos={["点赞", "收藏", "分享"]} />}
      commentsSlot={<Placeholder title="评论区占位" />}
    />
  );
}
