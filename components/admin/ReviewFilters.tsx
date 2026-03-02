'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
      <Input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        aria-label="搜索标题或简介"
        placeholder="搜索标题/简介"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ContentStatus | 'all')}
        aria-label="按状态筛选"
      >
        {['all', 'PendingReview', 'Approved', 'Reject', 'Listed', 'Unlisted', 'Draft'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>
      <Select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as ContentType | 'all')}
        aria-label="按类型筛选"
      >
        {['all', 'prompt', 'mcp', 'skill', 'tutorial'].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </Select>
    </div>
  );
}
