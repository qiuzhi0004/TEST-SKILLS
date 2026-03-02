import Link from "next/link";

export interface SideNavItem {
  label: string;
  href: string;
}

interface SideNavProps {
  title?: string;
  items: SideNavItem[];
}

export function SideNav({ title = "导航", items }: SideNavProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">{title}</h2>
      <ul className="space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded px-2 py-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
