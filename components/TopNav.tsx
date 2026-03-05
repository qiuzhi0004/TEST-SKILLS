'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AUTH_SESSION_CHANGE_EVENT, loadAuthSession } from "@/lib/client/auth";

const NAV_ITEMS = [
  { href: "/prompts", label: "Prompt" },
  { href: "/skills", label: "Skill" },
  { href: "/mcps", label: "MCP" },
  { href: "/tutorials", label: "社区" },
  { href: "/ranks", label: "榜单" },
];

const DJANGO_ADMIN_URL =
  process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [meHref, setMeHref] = useState("/login?next=%2Fme%2Ffavorites");

  useEffect(() => {
    const syncHref = () => {
      const isLoggedIn = Boolean(loadAuthSession());
      setMeHref(isLoggedIn ? "/me/favorites" : "/login?next=%2Fme%2Ffavorites");
    };
    syncHref();
    window.addEventListener("storage", syncHref);
    window.addEventListener(AUTH_SESSION_CHANGE_EVENT, syncHref);
    return () => {
      window.removeEventListener("storage", syncHref);
      window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, syncHref);
    };
  }, []);

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
            href={meHref}
            className="rounded-md px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          >
            个人中心
          </Link>
          <a
            href={DJANGO_ADMIN_URL}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          >
            管理登录
          </a>
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
            <Link href={meHref} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
              个人中心
            </Link>
            <a href={DJANGO_ADMIN_URL} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
              管理登录
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
