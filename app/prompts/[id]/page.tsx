'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { PromptEffectPreview } from '@/components/prompts/PromptEffectPreview';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { getPrompt } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import { pickUnsplash, resolveCoverSrc, toAssetSrc } from '@/lib/visualAssets';
import type { PromptDetailVM } from '@/types/prompt';

interface PromptShowcaseLike {
  id: string;
  asset_id: string | null;
  media_type: 'text' | 'image' | 'video';
  caption: string | null;
}

function toDisplayLanguage(language: string): string {
  if (!language) return '暂无';
  const normalized = language.toLowerCase();
  if (normalized === 'zh-cn' || normalized === 'zh') return '中文';
  if (normalized === 'en' || normalized === 'en-us') return '英文';
  return language;
}

function looksLikeVideo(src?: string | null): boolean {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

function toModelTags(modelName: string): string[] {
  return modelName
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'prompt' as const, target_id: id };
  const [detail, setDetail] = useState<PromptDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getPrompt(id);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500">加载中...</p>;
  }

  if (!detail) {
    return (
      <SectionCard title={`Prompt 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 4);
  const modelTags = toModelTags(detail.model_name);
  const isTextPrompt = detail.content.tag_ids.includes('prompt_text');

  const showcaseItems: PromptShowcaseLike[] = detail.showcases.length > 0
    ? detail.showcases.map((item) => ({
        id: item.id,
        asset_id: item.asset_id,
        media_type: item.media_type,
        caption: item.caption,
      }))
    : [
        {
          id: 'prompt-showcase-fallback',
          asset_id: detail.content.cover_asset_id,
          media_type: looksLikeVideo(detail.content.cover_asset_id) ? 'video' : 'image',
          caption: detail.content.one_liner,
        },
      ];

  const heroAssetId = detail.content.cover_asset_id || showcaseItems[0]?.asset_id || null;
  const heroSrc = resolveCoverSrc({
    assetId: heroAssetId,
    seed: `prompt:${detail.content.id}:hero`,
    type: 'prompt',
  });
  const heroIsVideo = looksLikeVideo(heroAssetId) || showcaseItems[0]?.media_type === 'video';

  return (
    <div className="space-y-4">
      <StatusBanner type="prompt" id={id} status={detail.content.status} />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          {heroIsVideo ? (
            <video src={heroSrc} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            <Image
              src={heroSrc}
              alt={detail.content.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
        </div>

        <div className="relative p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[#f8d3bf]">Prompt Detail</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{detail.content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">{detail.content.one_liner || '暂无一句话描述'}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {modelTags.map((model) => (
              <span
                key={model}
                className="rounded-full border border-white/50 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-sm"
              >
                {model}
              </span>
            ))}
            <span className="rounded-full border border-white/45 bg-black/20 px-3 py-1 text-xs text-slate-100">
              {toDisplayLanguage(detail.language)}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {!isTextPrompt ? (
            <SectionCard title="案例预览" description="展示效果与详情页保持一致，可横向滑动查看。">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
                {showcaseItems.map((item) => {
                  const src = toAssetSrc(item.asset_id) ?? pickUnsplash(`prompt:${detail.content.id}:${item.id}`, 'prompt');
                  const isVideo = item.media_type === 'video' || looksLikeVideo(item.asset_id) || looksLikeVideo(src);

                  return (
                    <article
                      key={item.id}
                      className="w-full min-w-full snap-start overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      {isVideo ? (
                        <video src={src} controls playsInline className="aspect-[16/9] h-auto w-full object-cover" />
                      ) : (
                        <Image
                          src={src}
                          alt={item.caption || '案例效果图'}
                          width={1280}
                          height={720}
                          className="aspect-[16/9] h-auto w-full object-cover"
                        />
                      )}
                      <div className="border-t border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600">
                        {item.caption || '案例说明待补充'}
                      </div>
                    </article>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="获取资源" description="复制后即可在模型侧直接使用。">
            <PromptEffectPreview detail={detail} />
          </SectionCard>

          <SectionCard title="评论区">
            <CommentThread target={target} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-[#fff5ef] via-[#fffaf8] to-white px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">基础信息</h3>
            </div>

            <div className="space-y-4 p-5 text-sm text-slate-700">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">标签</p>
                {displayTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {displayTags.map((tag) => (
                      <Badge key={tag.id} tone="info">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">暂无</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">名称</p>
                <p className="text-sm text-slate-800">{detail.content.title}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">类型</p>
                <p className="text-sm text-slate-800">Prompt</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">语言</p>
                <p className="text-sm text-slate-800">{toDisplayLanguage(detail.language)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">模型</p>
                <p className="text-sm text-slate-800">{detail.model_name || '暂无'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">用途一句话</p>
                <p className="text-sm text-slate-800">{detail.content.one_liner ?? '暂无'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <SocialBar target={target} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
