'use client';

import { useEffect, useState } from 'react';
import { getUpvoteCount, getVote, toggleVote } from '@/lib/api/social';
import type { SocialTarget, VoteValue } from '@/types/social';

interface VoteButtonsProps {
  target: SocialTarget;
}

export function VoteButtons({ target }: VoteButtonsProps) {
  const [vote, setVote] = useState<VoteValue>(null);
  const [upCount, setUpCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getVote(target), getUpvoteCount(target)]).then(([voteValue, count]) => {
      if (!cancelled) {
        setVote(voteValue);
        setUpCount(count);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const onVote = async (value: 'up' | 'down') => {
    const next = await toggleVote(target, value);
    setVote(next);
    setUpCount(next === 'up' ? 1 : 0);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onVote('up')}
        className={`rounded-md border px-2.5 py-1 text-xs ${vote === 'up' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}
      >
        👍 赞 {upCount}
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
