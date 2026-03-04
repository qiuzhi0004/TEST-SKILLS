'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SideNav } from '@/components/layout/SideNav';
import { getAuthSession, logout, onAuthChanged } from '@/lib/client/auth';

export function MeLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLoggedIn(Boolean(getAuthSession()));
    };
    sync();
    return onAuthChanged(sync);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <SideNav
        title="个人中心"
        items={[
          { label: '收藏', href: '/me/favorites' },
          { label: '发布', href: '/me/published' },
        ]}
      />
      <div className="space-y-4">
        <div>{children}</div>
        <div className="flex justify-end">
          {loggedIn ? (
            <button
              type="button"
              onClick={() => {
                logout();
                router.refresh();
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              退出登录
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/login?returnTo=${encodeURIComponent(pathname || '/me/favorites')}`)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
