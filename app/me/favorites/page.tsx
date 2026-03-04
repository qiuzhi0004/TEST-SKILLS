// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { FavoritesLibrary } from '@/components/social/FavoritesLibrary';

export default function MeFavoritesPage() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="bg-gradient-to-r from-[#fff5ef] via-[#fffaf8] to-white px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">我的收藏</h2>
        <p className="mt-1 text-sm text-slate-600">按类型查看已收藏的 Prompt、Skill、MCP 与帖子。</p>
      </div>
      <div className="p-5">
        <FavoritesLibrary />
      </div>
    </section>
  );
}
