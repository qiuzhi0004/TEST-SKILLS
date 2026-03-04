// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { MeLayoutClient } from "@/components/me/MeLayoutClient";

export const metadata: Metadata = {
  title: "个人中心",
  description: "我的收藏与发布内容管理。",
};

export default function MeLayout({ children }: { children: ReactNode }) {
  return <MeLayoutClient>{children}</MeLayoutClient>;
}
