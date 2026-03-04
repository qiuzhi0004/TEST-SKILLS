'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const NAV_ITEMS = [
  { href: "/prompts", label: "Prompt" },
  { href: "/skills", label: "Skill" },
  { href: "/mcps", label: "MCP" },
  { href: "/tutorials", label: "社区" },
  { href: "/ranks", label: "榜单" },
];

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-slate-900">
          AI资源站
        </Link>

        <nav className="hidden items-center gap-3 text-sm text-slate-700 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 text-sm md:flex">
          <Link
            href="/me/favorites"
            className="rounded-md px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          >
            个人中心
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          >
            后台
          </Link>
        </div>

        <Button
          type="button"
          size="sm"
          className="md:hidden"
          aria-label={open ? "收起导航菜单" : "展开导航菜单"}
          onClick={() => setOpen((prev) => !prev)}
        >
          菜单
        </Button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/me/favorites" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
              个人中心
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
              后台
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
