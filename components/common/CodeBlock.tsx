'use client';

import { CopyButton } from '@/components/common/CopyButton';

interface CodeBlockProps {
  title?: string;
  value: string;
  emptyText?: string;
}

export function CodeBlock({ title, value, emptyText = '暂无内容' }: CodeBlockProps) {
  const display = value?.trim() ? value : emptyText;

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">{title ?? '代码块'}</p>
        <CopyButton value={display} />
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs leading-relaxed text-slate-700">
        {display}
      </pre>
    </div>
  );
}
