// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function MeFavoritesPage() {
  return (
    <PageShell title="个人中心 - 收藏" subtitle="低保真块：左侧文件夹树 + 右侧收藏卡片流">
      <SectionCard title="文件夹树与操作">
        <Placeholder title="文件夹树占位" todos={["树结构(<=5层)", "新建/重命名/删除", "删除二次确认"]} />
      </SectionCard>
      <SectionCard title="当前文件夹内容">
        <Placeholder title="收藏列表占位" todos={["folder_id 过滤", "卡片流", "分页"]} />
      </SectionCard>
    </PageShell>
  );
}
