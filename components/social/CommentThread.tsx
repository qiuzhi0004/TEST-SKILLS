'use client';

import { useEffect, useState } from 'react';
import { createComment, deleteComment, listComments } from '@/lib/api/social';
import { CommentComposer } from '@/components/social/CommentComposer';
import { CommentItem } from '@/components/social/CommentItem';
import type { Comment, SocialTarget } from '@/types/social';

interface CommentThreadProps {
  target: SocialTarget;
}

export function CommentThread({ target }: CommentThreadProps) {
  const [items, setItems] = useState<Comment[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listComments(target).then((list) => {
      if (!cancelled) {
        setItems(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const refresh = async () => {
    const list = await listComments(target);
    setItems(list);
  };

  const handleCreate = async (content: string) => {
    await createComment(target, content);
    await refresh();
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(target, commentId);
    await refresh();
  };

  return (
    <div className="space-y-3">
      <CommentComposer onSubmit={handleCreate} />
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
          暂无评论，来发表第一条评论吧。
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <CommentItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
