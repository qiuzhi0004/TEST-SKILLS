'use client';

import { FavoriteButton } from '@/components/social/FavoriteButton';
import { ShareButton } from '@/components/social/ShareButton';
import { VoteButtons } from '@/components/social/VoteButtons';
import type { SocialTarget } from '@/types/social';

interface SocialBarProps {
  target: SocialTarget;
}

export function SocialBar({ target }: SocialBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <VoteButtons target={target} />
      <FavoriteButton target={target} />
      <ShareButton />
    </div>
  );
}
