'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/client/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [tip, setTip] = useState('');

  const returnTo = searchParams.get('returnTo') || '/me/favorites';

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      login(nickname || phone || '用户');
      router.push(returnTo);
      router.refresh();
    } catch {
      setTip('登录失败，请重试');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">登录</h1>
        <p className="mt-2 text-sm text-slate-600">继续访问你的个人中心与发布管理。</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 text-sm text-slate-700">
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            placeholder="用户名称（推荐）"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            placeholder="手机号"
          />
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="验证码"
            />
            <button
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-slate-700 transition hover:bg-slate-50"
              type="button"
            >
              发送验证码
            </button>
          </div>
          <button
            className="mt-1 h-11 rounded-xl bg-slate-900 px-4 font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            登录
          </button>
          {tip ? <p className="text-xs text-rose-600">{tip}</p> : null}
        </form>
      </div>
    </div>
  );
}
