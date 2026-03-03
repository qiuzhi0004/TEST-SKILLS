'use client';

import { useEffect, useState } from 'react';
import { ResourceCard } from '@/components/resource/ResourceCard';
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
  const [activeType, setActiveType] = useState<'all' | ContentType>('all');
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
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: '全部', value: 'all' as const },
            { label: 'Prompt', value: 'prompt' as const },
            { label: 'Skill', value: 'skill' as const },
            { label: 'MCP', value: 'mcp' as const },
            { label: '教程', value: 'tutorial' as const },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveType(tab.value)}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                activeType === tab.value
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">暂无收藏内容</p>
      </div>
    );
  }

  const filteredItems = activeType === 'all' ? items : items.filter((item) => item.type === activeType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { label: '全部', value: 'all' as const },
          { label: 'Prompt', value: 'prompt' as const },
          { label: 'Skill', value: 'skill' as const },
          { label: 'MCP', value: 'mcp' as const },
          { label: '教程', value: 'tutorial' as const },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveType(tab.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              activeType === tab.value
                ? 'border-sky-300 bg-sky-50 text-sky-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">当前筛选下暂无收藏内容</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div key={`${item.type}:${item.id}`} className="rounded-lg border border-slate-200 bg-white p-4">
              <ResourceCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
