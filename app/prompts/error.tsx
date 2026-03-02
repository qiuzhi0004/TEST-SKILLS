'use client';

import { Button } from '@/components/ui/Button';

export default function SegmentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
      <p className="text-sm font-semibold">分区加载失败</p>
      <p className="mt-1 text-xs">请点击重试，或返回上级页面。</p>
      <div className="mt-3"><Button variant="danger" size="sm" onClick={reset}>重试</Button></div>
    </div>
  );
}
