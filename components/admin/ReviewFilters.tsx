'use client';

import type { ContentStatus, ContentType } from '@/types/content';

interface ReviewFiltersProps {
  q: string;
  status: ContentStatus | 'all';
  type: ContentType | 'all';
  onQChange: (value: string) => void;
  onStatusChange: (value: ContentStatus | 'all') => void;
  onTypeChange: (value: ContentType | 'all') => void;
}

export function ReviewFilters({ q, status, type, onQChange, onStatusChange, onTypeChange }: ReviewFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      <input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="搜索标题/简介"
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ContentStatus | 'all')}
        className="rounded border border-slate-300 px-2 py-2 text-sm"
      >
        {['all', 'PendingReview', 'Approved', 'Reject', 'Listed', 'Unlisted', 'Draft'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as ContentType | 'all')}
        className="rounded border border-slate-300 px-2 py-2 text-sm"
      >
        {['all', 'prompt', 'mcp', 'skill', 'tutorial'].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
