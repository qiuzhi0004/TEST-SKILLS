import Link from "next/link";

const NAV_ITEMS = [
  { href: "/prompts", label: "Prompt" },
  { href: "/skills", label: "Skill" },
  { href: "/mcps", label: "MCP" },
  { href: "/tutorials", label: "教程" },
  { href: "/ranks", label: "榜单" },
];

export function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-slate-900">
          AI资源站
        </Link>

        <nav className="flex items-center gap-3 text-sm text-slate-700">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/me/favorites"
            className="rounded-md px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            个人中心
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            后台
          </Link>
        </div>
      </div>
    </header>
  );
}
