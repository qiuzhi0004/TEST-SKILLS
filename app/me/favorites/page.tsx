// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { FavoritesLibrary } from "@/components/social/FavoritesLibrary";

export default function MeFavoritesPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <FavoritesLibrary />
    </section>
  );
}
