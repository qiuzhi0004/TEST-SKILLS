'use client';

import { useEffect, useState } from 'react';
import { getVote, toggleVote } from '@/lib/api/social';
import type { SocialTarget, VoteValue } from '@/types/social';

interface VoteButtonsProps {
  target: SocialTarget;
}

export function VoteButtons({ target }: VoteButtonsProps) {
  const [vote, setVote] = useState<VoteValue>(null);

  useEffect(() => {
    let cancelled = false;
    void getVote(target).then((value) => {
      if (!cancelled) {
        setVote(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const onVote = async (value: 'up' | 'down') => {
    const next = await toggleVote(target, value);
    setVote(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onVote('up')}
        className={`rounded-md border px-2.5 py-1 text-xs ${vote === 'up' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}
      >
        👍 赞
      </button>
      <button
        type="button"
        onClick={() => onVote('down')}
        className={`rounded-md border px-2.5 py-1 text-xs ${vote === 'down' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-700'}`}
      >
        👎 踩
      </button>
    </div>
  );
}
