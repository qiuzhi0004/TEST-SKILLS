'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { ResourceCard } from '@/components/resource/ResourceCard';
import { FavoriteButton } from '@/components/social/FavoriteButton';
import { getMcp, getPrompt, getSkill, getTutorial } from '@/lib/api';
import { listFavoriteTargets } from '@/lib/api/social';
import type { ContentSummaryVM, ContentType } from '@/types/content';
import type { SocialTarget } from '@/types/social';

function toSummaryBase(input: {
  id: string;
  type: ContentType;
  title: string;
  one_liner: string | null;
  status: ContentSummaryVM['status'];
  category_ids: string[];
  tag_ids: string[];
  author_id: string;
  cover_asset_id: string | null;
  created_at: string;
  updated_at: string;
}): ContentSummaryVM {
  return {
    id: input.id,
    type: input.type,
    status: input.status,
    title: input.title,
    one_liner: input.one_liner,
    category_ids: input.category_ids,
    tag_ids: input.tag_ids,
    author: {
      id: input.author_id,
      nickname: input.author_id,
      avatar_asset_id: null,
    },
    cover_asset_id: input.cover_asset_id,
    stats_7d: {
      views: 0,
      up: 0,
      comments: 0,
      hot_score: 0,
    },
    created_at: input.created_at,
    updated_at: input.updated_at,
    highlight: {
      title: null,
      one_liner: null,
      document: null,
    },
  };
}

async function resolveTarget(target: SocialTarget): Promise<ContentSummaryVM | null> {
  try {
    if (target.target_type === 'prompt') {
      const detail = await getPrompt(target.target_id);
      return toSummaryBase({
        id: detail.content.id,
        type: 'prompt',
        title: detail.content.title,
        one_liner: detail.content.one_liner,
        status: detail.content.status,
        category_ids: detail.content.category_ids,
        tag_ids: detail.content.tag_ids,
        author_id: detail.content.author_id,
        cover_asset_id: detail.content.cover_asset_id,
        created_at: detail.content.created_at,
        updated_at: detail.content.updated_at,
      });
    }

    if (target.target_type === 'mcp') {
      const detail = await getMcp(target.target_id);
      return toSummaryBase({
        id: detail.content.id,
        type: 'mcp',
        title: detail.content.title,
        one_liner: detail.content.one_liner,
        status: detail.content.status,
        category_ids: detail.content.category_ids,
        tag_ids: detail.content.tag_ids,
        author_id: detail.content.author_id,
        cover_asset_id: detail.content.cover_asset_id,
        created_at: detail.content.created_at,
        updated_at: detail.content.updated_at,
      });
    }

    if (target.target_type === 'skill') {
      const detail = await getSkill(target.target_id);
      return toSummaryBase({
        id: detail.content.id,
        type: 'skill',
        title: detail.content.title,
        one_liner: detail.content.one_liner,
        status: detail.content.status,
        category_ids: detail.content.category_ids,
        tag_ids: detail.content.tag_ids,
        author_id: detail.content.author_id,
        cover_asset_id: detail.content.cover_asset_id,
        created_at: detail.content.created_at,
        updated_at: detail.content.updated_at,
      });
    }

    const detail = await getTutorial(target.target_id);
    return toSummaryBase({
      id: detail.content.id,
      type: 'tutorial',
      title: detail.content.title,
      one_liner: detail.content.one_liner,
      status: detail.content.status,
      category_ids: detail.content.category_ids,
      tag_ids: detail.content.tag_ids,
      author_id: detail.content.author_id,
      cover_asset_id: detail.content.cover_asset_id,
      created_at: detail.content.created_at,
      updated_at: detail.content.updated_at,
    });
  } catch {
    return null;
  }
}

export function FavoritesLibrary() {
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const targets = await listFavoriteTargets();
      const resolved = await Promise.all(targets.map((target) => resolveTarget(target)));
      if (!cancelled) {
        setItems(resolved.filter((item): item is ContentSummaryVM => item !== null));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">加载收藏中...</p>;
  }

  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">暂无收藏内容</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={`${item.type}:${item.id}`} className="rounded-lg border border-slate-200 bg-white p-4">
          <ResourceCard item={item} />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              <Badge tone="muted">{item.type} · {item.status}</Badge>
            </span>
            <FavoriteButton
              target={{ target_type: item.type, target_id: item.id }}
              onChanged={(next) => {
                if (!next) {
                  setItems((prev) => prev.filter((p) => !(p.type === item.type && p.id === item.id)));
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
