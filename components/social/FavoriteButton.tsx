'use client';

import { useEffect, useState } from 'react';
import { getFavoriteCount, isFavorite, toggleFavorite } from '@/lib/api/social';
import type { SocialTarget } from '@/types/social';

interface FavoriteButtonProps {
  target: SocialTarget;
  onChanged?: (next: boolean) => void;
}

export function FavoriteButton({ target, onChanged }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([isFavorite(target), getFavoriteCount(target)]).then(([value, count]) => {
      if (!cancelled) {
        setFavorited(value);
        setFavoriteCount(count);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const onToggle = async () => {
    const next = await toggleFavorite(target);
    setFavorited(next);
    setFavoriteCount(next ? 1 : 0);
    onChanged?.(next);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-md border px-2.5 py-1 text-xs ${favorited ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-700'}`}
    >
      {favorited ? `★ 已收藏 ${favoriteCount}` : `☆ 收藏 ${favoriteCount}`}
    </button>
  );
}
