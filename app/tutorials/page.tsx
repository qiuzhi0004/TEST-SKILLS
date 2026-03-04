'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { pickUnsplash, resolveCoverSrc } from '@/lib/visualAssets';
import type { ContentSummaryVM } from '@/types/content';

type FeedTab = 'recommended' | 'hot' | 'latest';

const COMMUNITY_TYPES = [
  { label: '全部', tagId: '' },
  { label: '文字', tagId: 'post_text' },
  { label: '图像', tagId: 'post_image' },
  { label: '视频', tagId: 'post_video' },
  { label: '音频', tagId: 'post_audio' },
  { label: '数字人', tagId: 'post_digital_human' },
  { label: '浏览器', tagId: 'post_browser' },
  { label: '编程', tagId: 'post_coding' },
  { label: 'Agent', tagId: 'post_agent' },
  { label: '自动工作流', tagId: 'post_workflow' },
  { label: '知识库', tagId: 'post_knowledge_base' },
] as const;

const TAG_LABEL: Record<string, string> = {
  post_text: '文字',
  post_image: '图像',
  post_video: '视频',
  post_audio: '音频',
  post_digital_human: '数字人',
  post_browser: '浏览器',
  post_coding: '编程',
  post_agent: 'Agent',
  post_workflow: '自动工作流',
  post_knowledge_base: '知识库',
  'tag-workflow': '工作流',
  'tag-productivity': '效率',
  'tag-agent': '智能体',
  'tag-open-source': '开源',
  'tag-beginner': '入门',
};

function calcHotScore(item: ContentSummaryVM) {
  return item.stats_7d.views + item.stats_7d.up * 5 + item.stats_7d.comments * 3;
}

function formatCompact(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return `${value}`;
}

function getTypeLabel(item: ContentSummaryVM) {
  const hit = COMMUNITY_TYPES.find((type) => type.tagId && item.tag_ids.includes(type.tagId));
  return hit?.label ?? '社区';
}

function topTags(item: ContentSummaryVM) {
  const labels = item.tag_ids.map((id) => TAG_LABEL[id]).filter(Boolean);
  return labels.slice(0, 3);
}

function formatDate(date: string) {
  try {
    const value = new Date(date);
    return `${value.getMonth() + 1}-${value.getDate()}`;
  } catch {
    return '--';
  }
}

function looksLikeVideo(src?: string | null): boolean {
  if (!src) return false;
  const plain = src.split('?')[0]?.toLowerCase() ?? '';
  return plain.endsWith('.mp4') || plain.endsWith('.webm') || plain.endsWith('.mov') || plain.endsWith('.m4v');
}

export default function TutorialsPage() {
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [activeType, setActiveType] = useState<(typeof COMMUNITY_TYPES)[number]['label']>('全部');
  const [activeTab, setActiveTab] = useState<FeedTab>('recommended');

  useEffect(() => {
    let cancelled = false;

    void listContents({ type: 'tutorial', q: keyword.trim(), limit: 200, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items.filter((item) => item.status === 'Listed'));
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError('社区内容加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const typeCounts = useMemo(() => {
    return COMMUNITY_TYPES.reduce<Record<string, number>>((acc, type) => {
      acc[type.label] = type.tagId ? items.filter((item) => item.tag_ids.includes(type.tagId)).length : items.length;
      return acc;
    }, {});
  }, [items]);

  const filteredItems = useMemo(() => {
    let next = items;
    const type = COMMUNITY_TYPES.find((item) => item.label === activeType);
    if (type?.tagId) {
      next = next.filter((item) => item.tag_ids.includes(type.tagId));
    }

    const sorted = [...next];
    sorted.sort((a, b) => {
      if (activeTab === 'latest') {
        return b.updated_at.localeCompare(a.updated_at);
      }
      if (activeTab === 'hot') {
        return calcHotScore(b) - calcHotScore(a);
      }
      return b.stats_7d.up - a.stats_7d.up;
    });
    return sorted;
  }, [activeTab, activeType, items]);

  const featured = filteredItems[0] ?? null;
  const featuredSecondary = filteredItems.slice(1, 4);
  const featuredCoverSrc = featured
    ? resolveCoverSrc({ assetId: featured.cover_asset_id, seed: `community:featured:${featured.id}`, type: 'tutorial' })
    : null;
  const featuredCoverIsVideo =
    !!featured && (looksLikeVideo(featured.cover_asset_id) || looksLikeVideo(featuredCoverSrc));
  const trending = useMemo(() => {
    return [...items].sort((a, b) => calcHotScore(b) - calcHotScore(a)).slice(0, 8);
  }, [items]);

  const totalViews = useMemo(() => items.reduce((sum, item) => sum + item.stats_7d.views, 0), [items]);
  const totalInteractions = useMemo(
    () => items.reduce((sum, item) => sum + item.stats_7d.comments + item.stats_7d.up, 0),
    [items],
  );

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    if (searchText.trim() === keyword.trim()) {
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setKeyword(searchText);
  };

  return (
    <section className="space-y-4 bg-[#f6f7f9] p-3 text-slate-700 sm:p-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={pickUnsplash('community:hero', 'tutorial')}
            alt="社区头图"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/86 via-slate-900/62 to-[#FC6624]/36" />
        </div>

        <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
          <div className="space-y-4">
            <div>
              <p className="inline-flex rounded-full border border-[#FC6624]/60 bg-[#FC6624]/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-white">
                Community
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">社区</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200">分享方法、实战流程与踩坑经验，沉淀可复用的创作资产。</p>
            </div>

            <form onSubmit={onSearch} className="relative max-w-3xl">
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="搜索帖子标题/摘要"
                className="h-12 w-full rounded-xl border border-white/30 bg-white/92 pl-4 pr-16 text-sm text-slate-900 shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-white/70"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 inline-flex h-8 w-12 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm text-slate-700 transition hover:bg-slate-50"
              >
                搜索
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {[
                { label: '推荐', value: 'recommended' as const },
                { label: '热门', value: 'hot' as const },
                { label: '最新', value: 'latest' as const },
              ].map((tab) => {
                const active = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-[#f8c6af] bg-[#fff2eb] text-[#d44d16]'
                        : 'border-white/45 bg-slate-900/25 text-slate-100 hover:bg-slate-900/35'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-white/25 bg-white/12 backdrop-blur-md">
            <div className="relative h-28 w-full">
              <Image
                src={pickUnsplash('community:snapshot', 'tutorial')}
                alt="社区数据背景"
                fill
                sizes="320px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/55" />
            </div>
            <div className="space-y-3 p-4 text-white">
              <p className="text-xs tracking-[0.1em] text-slate-200">DATA SNAPSHOT</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/20 bg-black/15 p-2 text-center">
                  <p className="text-[11px] text-slate-200">帖子</p>
                  <p className="mt-1 text-base font-semibold">{items.length}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/15 p-2 text-center">
                  <p className="text-[11px] text-slate-200">浏览</p>
                  <p className="mt-1 text-base font-semibold">{formatCompact(totalViews)}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/15 p-2 text-center">
                  <p className="text-[11px] text-slate-200">互动</p>
                  <p className="mt-1 text-base font-semibold">{formatCompact(totalInteractions)}</p>
                </div>
              </div>

              <Link
                href="/tutorials/new"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#FC6624] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#e95a1d]"
              >
                发布帖子
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {featured ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.06)] sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
                <Link
                  href={`/tutorials/${featured.id}`}
                  className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <div className="relative h-52 sm:h-64">
                    {featuredCoverIsVideo ? (
                      <video
                        src={featuredCoverSrc ?? ''}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <Image
                        src={featuredCoverSrc ?? ''}
                        alt={featured.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 900px"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                      <p className="text-xs tracking-wide text-slate-100">今日焦点</p>
                      <h2 className="mt-1 line-clamp-2 text-xl font-semibold sm:text-2xl">{featured.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-100">{featured.one_liner || '查看帖子详情'}</p>
                    </div>
                  </div>
                </Link>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-slate-500">编辑精选</p>
                    <span className="text-xs text-[#d44d16]">Top 3</span>
                  </div>
                  <div className="space-y-2">
                    {featuredSecondary.length > 0 ? (
                      featuredSecondary.map((item, index) => (
                        <Link
                          key={item.id}
                          href={`/tutorials/${item.id}`}
                          className="group block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
                              {index + 1}
                            </span>
                            <span className="text-xs text-slate-500">{getTypeLabel(item)}</span>
                          </div>
                          <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-[#FC6624]">{item.title}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">暂无更多推荐帖子</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {loading ? <p className="text-sm text-slate-500">社区内容加载中...</p> : null}
          {error ? <p className="text-sm text-[#b74b1f]">{error}</p> : null}
          {!loading && !error && filteredItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">当前筛选下暂无帖子</p>
          ) : null}

          {!loading && !error && filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const coverSrc = resolveCoverSrc({ assetId: item.cover_asset_id, seed: `community:list:${item.id}`, type: 'tutorial' });
                const coverIsVideo = looksLikeVideo(item.cover_asset_id) || looksLikeVideo(coverSrc);
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition hover:border-slate-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">{getTypeLabel(item)}</span>
                          <span>{formatDate(item.updated_at)}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900">
                          <Link href={`/tutorials/${item.id}`} className="transition hover:text-[#FC6624]">
                            {item.title}
                          </Link>
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.one_liner || '暂无简介'}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {topTags(item).map((label) => (
                            <span key={label} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {label}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>👍 {formatCompact(item.stats_7d.up)}</span>
                          <span>💬 {formatCompact(item.stats_7d.comments)}</span>
                          <span>👀 {formatCompact(item.stats_7d.views)}</span>
                          <span className="ml-auto">作者：{item.author.nickname}</span>
                        </div>
                      </div>

                      <Link
                        href={`/tutorials/${item.id}`}
                        className="relative hidden h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:block"
                      >
                        {coverIsVideo ? (
                          <video src={coverSrc} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                        ) : (
                          <Image
                            src={coverSrc}
                            alt={item.title}
                            fill
                            sizes="220px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
            <h2 className="text-sm font-semibold text-slate-900">大家都在看</h2>
            <ol className="mt-3 space-y-2">
              {trending.map((item, index) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
                    {index + 1}
                  </span>
                  <Link href={`/tutorials/${item.id}`} className="line-clamp-2 text-sm text-slate-700 hover:text-[#FC6624] hover:underline">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
            <h2 className="text-sm font-semibold text-slate-900">分类导航</h2>
            <div className="mt-3 space-y-2">
              {COMMUNITY_TYPES.filter((type) => type.label !== '全部').map((type) => {
                const active = activeType === type.label;
                return (
                  <button
                    key={type.label}
                    type="button"
                    onClick={() => setActiveType(type.label)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      active
                        ? 'border-[#f8c6af] bg-[#fff2eb] text-[#d44d16]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{type.label}</span>
                    <span className="text-xs">{typeCounts[type.label] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
