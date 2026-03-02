// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/SideNav";

export default function MeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <SideNav
        title="个人中心"
        items={[
          { label: "收藏", href: "/me/favorites" },
          { label: "发布", href: "/me/published" },
        ]}
      />
      <div>{children}</div>
    </div>
  );
}
