'use client';

import { Button } from '@/components/ui/Button';

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <h2 className="text-lg font-semibold">页面加载失败</h2>
      <p className="mt-1 text-sm">请重试，若持续失败请刷新浏览器。</p>
      <div className="mt-4">
        <Button variant="danger" onClick={reset}>重试</Button>
      </div>
    </div>
  );
}
