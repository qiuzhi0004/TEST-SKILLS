'use client';

import { useState } from 'react';

export function ShareButton() {
  const [done, setDone] = useState(false);

  const onShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch {
      setDone(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
    >
      {done ? '已复制链接' : '分享'}
    </button>
  );
}
