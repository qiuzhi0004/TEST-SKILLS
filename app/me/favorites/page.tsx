// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { FavoritesLibrary } from "@/components/social/FavoritesLibrary";
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
        <FavoritesLibrary />
      </SectionCard>
      <SectionCard title="说明">
        <Placeholder
          title="本地持久化说明"
          description="本阶段忽略登录守卫，收藏内容使用 localStorage 模拟“我的资产库”。"
          todos={["folder_id 分组后续实现", "分页后续实现"]}
        />
      </SectionCard>
    </PageShell>
  );
}
