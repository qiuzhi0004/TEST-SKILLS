'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
import { pickUnsplash } from '@/lib/visualAssets';
import type { ContentSummaryVM, ContentType } from '@/types/content';

type SupportedType = Extract<ContentType, 'prompt' | 'skill' | 'mcp'>;

const SUPPORTED_TYPES: SupportedType[] = ['prompt', 'skill', 'mcp'];
const PUBLIC_VISIBLE_STATUS = 'Listed';
const HOME_CHANNELS: Array<{ type: ContentType; label: string; subtitle: string; href: string; accent: string }> = [
  { type: 'prompt', label: 'Prompt', subtitle: '文本 / 图像 / 视频提示词', href: '/prompts', accent: '#FC6624' },
  { type: 'skill', label: 'Skill', subtitle: '可复用能力组件', href: '/skills', accent: '#0F766E' },
  { type: 'mcp', label: 'MCP', subtitle: '工具协议与服务接入', href: '/mcps', accent: '#2563EB' },
  { type: 'tutorial', label: '社区', subtitle: '帖子与实战经验', href: '/tutorials', accent: '#7C3AED' },
];
const TYPE_LABEL: Record<ContentType, string> = {
  prompt: 'Prompt',
  skill: 'Skill',
  mcp: 'MCP',
  tutorial: '社区',
};

function isSupportedType(type: ContentType): type is SupportedType {
  return SUPPORTED_TYPES.includes(type as SupportedType);
}

function mapToPublicSearchItems(items: ContentSummaryVM[]): ContentSummaryVM[] {
  return items.filter(
    (item) => isSupportedType(item.type) && item.status === PUBLIC_VISIBLE_STATUS,
  );
}

function calcHotScore(item: ContentSummaryVM): number {
  return item.stats_7d.views + item.stats_7d.up * 5 + item.stats_7d.comments * 3;
}

function formatCompact(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return `${value}`;
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function detailPath(item: ContentSummaryVM): string {
  if (item.type === 'prompt') return `/prompts/${item.id}`;
  if (item.type === 'skill') return `/skills/${item.id}`;
  if (item.type === 'mcp') return `/mcps/${item.id}`;
  return `/tutorials/${item.id}`;
}

export function HomeSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryInUrl = useMemo(() => searchParams.get('q')?.trim() ?? '', [searchParams]);
  const [inputValue, setInputValue] = useState(queryInUrl);
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(queryInUrl));
  const [discoverItems, setDiscoverItems] = useState<ContentSummaryVM[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  useEffect(() => {
    setInputValue(queryInUrl);
  }, [queryInUrl]);

  useEffect(() => {
    if (!queryInUrl) {
      setItems([]);
      setLoading(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    void listContents({ type: 'all', q: queryInUrl, offset: 0, limit: 60 })
      .then((res) => {
        if (cancelled) return;
        setItems(mapToPublicSearchItems(res.items));
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError('搜索失败，请稍后重试。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryInUrl]);

  useEffect(() => {
    let cancelled = false;
    setDiscoverLoading(true);

    void listContents({ type: 'all', offset: 0, limit: 120 })
      .then((res) => {
        if (cancelled) return;
        setDiscoverItems(res.items.filter((item) => item.status === PUBLIC_VISIBLE_STATUS));
      })
      .catch(() => {
        if (cancelled) return;
        setDiscoverItems([]);
      })
      .finally(() => {
        if (!cancelled) setDiscoverLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const submitSearch = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed === queryInUrl) {
        return;
      }

      const next = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        next.set('q', trimmed);
      } else {
        next.delete('q');
      }

      const nextQuery = next.toString();
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [inputValue, pathname, queryInUrl, router, searchParams],
  );

  const heroImages = useMemo(
    () => [
      pickUnsplash('home:hero:1', 'prompt'),
      pickUnsplash('home:hero:2', 'skill'),
      pickUnsplash('home:hero:3', 'mcp'),
    ],
    [],
  );

  const channelCounts = useMemo(() => {
    const map = new Map<ContentType, number>([
      ['prompt', 0],
      ['skill', 0],
      ['mcp', 0],
      ['tutorial', 0],
    ]);
    discoverItems.forEach((item) => {
      map.set(item.type, (map.get(item.type) ?? 0) + 1);
    });
    return map;
  }, [discoverItems]);

  const featuredItems = useMemo(() => {
    return [...discoverItems].sort((a, b) => calcHotScore(b) - calcHotScore(a)).slice(0, 6);
  }, [discoverItems]);

  const latestItems = useMemo(() => {
    return [...discoverItems].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
  }, [discoverItems]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 pb-10 pt-8 sm:pt-12">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 grid grid-cols-3">
          {heroImages.map((src) => (
            <div key={src} className="relative">
              <Image src={src} alt="资源背景图" fill sizes="33vw" className="object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/55" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 py-10 text-center sm:py-14">
          <p className="text-xs uppercase tracking-[0.16em] text-[#ffe8dd]">AI RESOURCE HUB</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            寻找优质的 AI 资源
          </h1>
          <p className="mt-2 text-sm text-slate-200">从 Prompt、Skill、MCP 到社区帖子，一次搜索全站覆盖。</p>

          <form onSubmit={submitSearch} className="mt-6 w-full sm:mt-7">
            <div className="relative">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-14 w-full rounded-full border border-white/30 bg-white/90 pl-6 pr-20 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#f2bea7] focus:ring-2 focus:ring-[#f2bea7]/40"
                placeholder="输入关键词开始全站搜索"
                aria-label="全站搜索"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2bea7] focus-visible:ring-offset-1"
                aria-label="执行搜索"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </section>

      {hasSearched ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">搜索结果</h2>
            {!loading && !error ? <p className="text-xs text-slate-500">共 {items.length} 条</p> : null}
          </div>

          {loading ? <p className="text-center text-sm text-slate-500">正在搜索...</p> : null}
          {error ? <p className="text-center text-sm text-rose-600">{error}</p> : null}
          {!loading && !error && items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">未找到相关结果。</p>
          ) : null}
          {!loading && !error && items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ResourceCard
                  key={`${item.type}:${item.id}`}
                  item={item}
                  showStatus={false}
                  maxTags={3}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!hasSearched ? (
        <section className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Quick Access</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">从入口快速浏览资源</h2>
              </div>
              <p className="text-xs text-slate-500">已收录：{formatCompact(discoverItems.length)} 条</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {HOME_CHANNELS.map((channel) => (
                <Link
                  key={channel.type}
                  href={channel.href}
                  className="group rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                  style={{ borderColor: `${channel.accent}4d`, background: `linear-gradient(165deg, ${channel.accent}1f 0%, #ffffff 62%)` }}
                >
                  <p className="text-base font-semibold text-slate-900">{channel.label}</p>
                  <p className="mt-1 text-xs text-slate-600">{channel.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">已收录 {channelCounts.get(channel.type) ?? 0}</span>
                    <span className="text-xs font-medium" style={{ color: channel.accent }}>
                      进入 →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">热门精选</h2>
                <p className="text-xs text-slate-500">按热度综合排序</p>
              </div>
              {discoverLoading ? <p className="text-sm text-slate-500">内容加载中...</p> : null}
              {!discoverLoading && featuredItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">暂时没有可展示的资源。</p>
              ) : null}
              {!discoverLoading && featuredItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featuredItems.map((item) => (
                    <ResourceCard key={`${item.type}:${item.id}`} item={item} showStatus={false} maxTags={3} />
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">最新动态</h2>
              <p className="mt-1 text-xs text-slate-500">最近更新的内容</p>
              {discoverLoading ? <p className="mt-4 text-sm text-slate-500">内容加载中...</p> : null}
              {!discoverLoading && latestItems.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">暂无动态</p>
              ) : null}
              {!discoverLoading && latestItems.length > 0 ? (
                <ol className="mt-3 space-y-2">
                  {latestItems.map((item, index) => (
                    <li key={`${item.type}:${item.id}`} className="flex gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
                        {index + 1}
                      </span>
                      <Link href={detailPath(item)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 transition hover:border-slate-300 hover:bg-white">
                        <p className="line-clamp-1 text-sm font-medium text-slate-800">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full border border-slate-200 px-1.5 py-0.5">{TYPE_LABEL[item.type]}</span>
                          <span>{formatDateLabel(item.updated_at)}</span>
                          <span>热度 {formatCompact(calcHotScore(item))}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}
    </section>
  );
}
