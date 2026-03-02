'use client';

import { useState } from 'react';

interface CommentComposerProps {
  onSubmit: (content: string) => Promise<void>;
}

export function CommentComposer({ onSubmit }: CommentComposerProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(value);
      setValue('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="写下你的评论..."
        rows={3}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布评论'}
        </button>
      </div>
    </div>
  );
}
