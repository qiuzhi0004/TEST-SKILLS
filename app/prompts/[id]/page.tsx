'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/common/Badge';
import { CodeBlock } from '@/components/common/CodeBlock';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { getPrompt } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import type { PromptDetailVM } from '@/types/prompt';

function toDisplayLanguage(language: string): string {
  if (!language) return '暂无';
  const normalized = language.toLowerCase();
  if (normalized === 'zh-cn' || normalized === 'zh') return '中文';
  if (normalized === 'en' || normalized === 'en-us') return '英文';
  return language;
}

function toShowcaseSrc(assetId?: string | null, externalUrl?: string | null): string | null {
  if (externalUrl) return externalUrl;
  if (!assetId) return null;
  if (assetId.startsWith('/')) return assetId;
  if (assetId.startsWith('http://') || assetId.startsWith('https://')) return assetId;
  if (assetId.startsWith('data/images/')) return `/${assetId.replace(/^data\//, '')}`;
  if (assetId.startsWith('data/videos/')) return `/${assetId.replace(/^data\//, '')}`;
  if (assetId.startsWith('images/')) return `/${assetId}`;
  if (assetId.startsWith('videos/')) return `/${assetId}`;
  if (assetId.includes('/')) return `/${assetId}`;
  return `/images/${assetId}`;
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

  const displayTags = toDisplayTags(detail.content.tag_ids, 3);
  const isTextPrompt = detail.content.tag_ids.includes('prompt_text');

  return (
    <div className="space-y-4">
      <StatusBanner type="prompt" id={id} status={detail.content.status} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {!isTextPrompt ? (
            <SectionCard title="案例展示">
              <div className="space-y-4">
                {(detail.showcases.length > 0 ? detail.showcases : [{ id: 'prompt-showcase-fallback' }]).map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                  >
                    {(() => {
                      const src = toShowcaseSrc(
                        'asset_id' in item ? item.asset_id : null,
                        'external_url' in item ? (item as { external_url?: string | null }).external_url ?? null : null,
                      );
                      if (!src) {
                        return (
                          <div className="rounded-md border border-slate-200 bg-slate-100 px-4 py-6 text-center text-sm text-slate-600">
                            案例效果展示区（图片/视频占位，暂无内容）
                          </div>
                        );
                      }

                      const mediaType = 'media_type' in item ? item.media_type : 'image';
                      return mediaType === 'video' ? (
                        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          <video
                            src={src}
                            controls
                            playsInline
                            className="h-auto w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          <Image
                            src={src}
                            alt="案例效果图"
                            width={1200}
                            height={700}
                            className="h-auto w-full object-cover"
                          />
                        </div>
                      );
                    })()}
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="获取资源">
            <div className="space-y-3">
              <CodeBlock title="Prompt 正文" value={detail.prompt_text} />
            </div>
          </SectionCard>
          <SectionCard title="评论区">
            <CommentThread target={target} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-3 text-sm text-slate-700">
                <h3 className="text-base font-semibold text-slate-900">基础信息</h3>

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
              <SocialBar target={target} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
