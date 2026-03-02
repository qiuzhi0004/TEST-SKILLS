import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionSlot?: ReactNode;
}

export function EmptyState({ title, description, actionSlot }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {actionSlot ? <div className="mt-3">{actionSlot}</div> : null}
    </div>
  );
}
