import type { ReactNode } from 'react';

type Tone = 'info' | 'warn' | 'danger' | 'success';

interface InlineNoticeProps {
  title: string;
  description?: string;
  tone?: Tone;
  actionSlot?: ReactNode;
}

const toneMap: Record<Tone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export function InlineNotice({ title, description, tone = 'info', actionSlot }: InlineNoticeProps) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${toneMap[tone]}`} role="status">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-0.5 text-xs opacity-90">{description}</p> : null}
      {actionSlot ? <div className="mt-2">{actionSlot}</div> : null}
    </div>
  );
}
