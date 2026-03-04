'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/common/Badge';
import { CopyButton } from '@/components/common/CopyButton';
import { Placeholder } from '@/components/layout/Placeholder';
import { SectionCard } from '@/components/layout/SectionCard';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { CommentThread } from '@/components/social/CommentThread';
import { SocialBar } from '@/components/social/SocialBar';
import { getSkill } from '@/lib/api';
import { toDisplayTags } from '@/lib/tagDisplay';
import { pickUnsplash, resolveCoverSrc, toAssetSrc } from '@/lib/visualAssets';
import type { SkillDetailVM } from '@/types/skill';

function parseRepoRef(repoUrl: string | null, title: string): string {
  if (repoUrl) {
    try {
      const url = new URL(repoUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    } catch {
      // noop
    }
  }
  if (title.includes('/')) return title;
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

function looksLikeVideo(src?: string | null): boolean {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

function toSourceLabel(source: SkillDetailVM['source']): string {
  if (source === 'official') return '官方';
  return '社区';
}

function resolveCaseMedia(item: SkillDetailVM['cases'][number], seed: string) {
  const media = item.media[0];
  const src = media?.external_url ?? toAssetSrc(media?.asset_id) ?? pickUnsplash(seed, 'skill');
  const isVideo = media?.media_type === 'video' || looksLikeVideo(media?.asset_id) || looksLikeVideo(media?.external_url);
  return { src, isVideo };
}

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const target = { target_type: 'skill' as const, target_id: id };
  const [detail, setDetail] = useState<SkillDetailVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getSkill(id);
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

  if (loading) return <p className="text-sm text-slate-500">加载中...</p>;

  if (!detail) {
    return (
      <SectionCard title={`Skill 详情（未找到：${id}）`}>
        <Placeholder title="资源不存在" description="请检查 id 或返回列表页重新选择。" />
      </SectionCard>
    );
  }

  const displayTags = toDisplayTags(detail.content.tag_ids, 4);
  const repoRef = parseRepoRef(detail.repo_url, detail.content.title);
  const installCommands = detail.install_commands.length > 0
    ? detail.install_commands
    : [
        `npx skills add ${repoRef}`,
        `bunx skills add ${repoRef}`,
        `pnpm dlx skills add ${repoRef}`,
      ];

  const heroAsset = detail.content.cover_asset_id;
  const heroSrc = resolveCoverSrc({ assetId: heroAsset, seed: `skill:${detail.content.id}:hero`, type: 'skill' });
  const heroIsVideo = looksLikeVideo(heroAsset);

  return (
    <div className="space-y-4">
      <StatusBanner type="skill" id={id} status={detail.content.status} />

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
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        </div>

        <div className="relative p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[#f8d3bf]">Skill Detail</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{detail.content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">{detail.content.one_liner || '暂无一句话描述'}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-100">
            <span className="rounded-full border border-white/45 bg-black/20 px-3 py-1">来源：{toSourceLabel(detail.source)}</span>
            <span className="rounded-full border border-white/45 bg-black/20 px-3 py-1">提供方：{detail.provider_name || '暂无'}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard title="案例展示" description="展示输入、过程与输出，帮助快速判断可复用性。">
            {detail.cases.length > 0 ? (
              <div className="space-y-4">
                {detail.cases.map((item, index) => {
                  const media = resolveCaseMedia(item, `skill:${detail.content.id}:case:${item.id || index}`);
                  return (
                    <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {media.isVideo ? (
                        <video src={media.src} controls playsInline className="aspect-[16/9] h-auto w-full object-cover" />
                      ) : (
                        <Image
                          src={media.src}
                          alt={item.title || '案例效果图'}
                          width={1280}
                          height={720}
                          className="aspect-[16/9] h-auto w-full object-cover"
                        />
                      )}

                      <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">用户输入</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.user_input || '暂无'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">执行过程</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.execution_process || '暂无'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">结果输出</h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.agent_output || '暂无'}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无案例</p>
            )}
          </SectionCard>

          <SectionCard
            title="如何使用"
            headerRight={(
              <button
                type="button"
                className="rounded-lg border border-[#f7b79a] bg-[#fff4ee] px-4 py-2 text-sm font-medium text-[#c94f1d] transition hover:bg-[#ffe8dc]"
                onClick={() => {}}
              >
                一键下载 Zip
              </button>
            )}
          >
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">一键复制安装指令（npx / bunx / pnpm）</p>
                <div className="mt-3 space-y-2">
                  {installCommands.map((command, index) => (
                    <div
                      key={command}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="font-mono text-xs text-slate-800 sm:text-sm">
                        {index + 1}. {command}
                      </p>
                      <CopyButton value={command} />
                    </div>
                  ))}
                </div>
              </div>

              {detail.usage_doc ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <h4 className="text-sm font-semibold text-slate-900">使用说明</h4>
                  <p className="mt-2 whitespace-pre-wrap">{detail.usage_doc}</p>
                </div>
              ) : null}
            </div>
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
                <p className="text-sm text-slate-800">Skill</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">提供方</p>
                <p className="text-sm text-slate-800">{detail.provider_name || '暂无'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">仓库地址</p>
                {detail.repo_url ? (
                  <a
                    href={detail.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-sm text-sky-700 hover:underline"
                  >
                    {detail.repo_url}
                  </a>
                ) : (
                  <p className="text-sm text-slate-800">暂无</p>
                )}
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
