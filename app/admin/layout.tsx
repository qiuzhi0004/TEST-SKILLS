// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/SideNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <SideNav
        title="管理后台"
        items={[
          { label: "内容审核", href: "/admin/moderation/cases" },
          { label: "分类管理", href: "/admin/categories" },
          { label: "标签管理", href: "/admin/tags" },
          { label: "用户管理", href: "/admin/users" },
          { label: "角色管理", href: "/admin/roles" },
          { label: "权限管理", href: "/admin/permissions" },
          { label: "权限矩阵", href: "/admin/role-permissions" },
          { label: "事件日志", href: "/admin/events" },
          { label: "审计日志", href: "/admin/audit-logs" },
        ]}
      />
      <div>{children}</div>
    </div>
  );
}
