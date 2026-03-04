'use client';

import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
import { pickUnsplash } from '@/lib/visualAssets';
import type { ContentSummaryVM, ContentType } from '@/types/content';

type SupportedType = Extract<ContentType, 'prompt' | 'skill' | 'mcp'>;

const SUPPORTED_TYPES: SupportedType[] = ['prompt', 'skill', 'mcp'];
const PUBLIC_VISIBLE_STATUS = 'Listed';

function isSupportedType(type: ContentType): type is SupportedType {
  return SUPPORTED_TYPES.includes(type as SupportedType);
}

function mapToPublicSearchItems(items: ContentSummaryVM[]): ContentSummaryVM[] {
  return items.filter(
    (item) => isSupportedType(item.type) && item.status === PUBLIC_VISIBLE_STATUS,
  );
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
    </section>
  );
}
