'use client';

import type { Comment } from '@/types/social';

interface CommentItemProps {
  item: Comment;
  onDelete: (commentId: string) => Promise<void>;
}

function fmt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('zh-CN');
}

export function CommentItem({ item, onDelete }: CommentItemProps) {
  return (
    <li className="rounded-md border border-slate-200 bg-white p-3">
      <p className="whitespace-pre-wrap text-sm text-slate-800">{item.content}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{fmt(item.created_at)}</span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded border border-slate-300 px-2 py-0.5 text-slate-600"
        >
          删除
        </button>
      </div>
    </li>
  );
}
