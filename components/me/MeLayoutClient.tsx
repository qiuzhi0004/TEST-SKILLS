'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SideNav } from '@/components/layout/SideNav';
import { pickUnsplash } from '@/lib/visualAssets';
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
    <div className="space-y-4 bg-[#f6f7f9] p-3 sm:p-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={pickUnsplash('me:layout:hero', 'tutorial')}
            alt="个人中心头图"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-900/58 to-[#FC6624]/35" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#ffd7c5]">Personal Center</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">个人中心</h1>
            <p className="mt-2 text-sm text-slate-200">管理收藏与发布内容，持续沉淀你的作品资产。</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (loggedIn) {
                logout();
                router.refresh();
                return;
              }
              router.push(`/login?returnTo=${encodeURIComponent(pathname || '/me/favorites')}`);
            }}
            className="rounded-lg border border-[#f7b79a] bg-[#fff4ee] px-4 py-2 text-sm font-medium text-[#c94f1d] transition hover:bg-[#ffe8dc]"
          >
            {loggedIn ? '退出登录' : '登录'}
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <SideNav
          title="个人导航"
          subtitle="收藏与发布管理"
          accent="#FC6624"
          items={[
            { label: '收藏', href: '/me/favorites' },
            { label: '发布', href: '/me/published' },
          ]}
        />

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
