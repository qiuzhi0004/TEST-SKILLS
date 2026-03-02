'use client';

import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite } from '@/lib/api/social';
import type { SocialTarget } from '@/types/social';

interface FavoriteButtonProps {
  target: SocialTarget;
  onChanged?: (next: boolean) => void;
}

export function FavoriteButton({ target, onChanged }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isFavorite(target).then((value) => {
      if (!cancelled) {
        setFavorited(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  const onToggle = async () => {
    const next = await toggleFavorite(target);
    setFavorited(next);
    onChanged?.(next);
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-md border px-2.5 py-1 text-xs ${favorited ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-700'}`}
    >
      {favorited ? '★ 已收藏' : '☆ 收藏'}
    </button>
  );
}
