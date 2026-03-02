'use client';

import { Button } from '@/components/ui/Button';

export default function DetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
      <p className="text-sm font-semibold">详情加载失败</p>
      <div className="mt-3"><Button size="sm" variant="danger" onClick={reset}>重试</Button></div>
    </div>
  );
}
