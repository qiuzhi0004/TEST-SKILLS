'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
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

  return (
    <section className="mx-auto w-full max-w-5xl pb-10 pt-12 sm:pt-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          寻找优质的 AI 资源
        </h1>

        <form onSubmit={submitSearch} className="mt-6 w-full sm:mt-8">
          <div className="relative">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-14 w-full rounded-full border border-slate-300 bg-white pl-6 pr-20 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="输入关键词开始全站搜索"
              aria-label="全站搜索"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
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

      {hasSearched ? (
        <div className="mt-8">
          {loading ? <p className="text-center text-sm text-slate-500">正在搜索...</p> : null}
          {error ? <p className="text-center text-sm text-rose-600">{error}</p> : null}
          {!loading && !error && items.length === 0 ? (
            <p className="text-center text-sm text-slate-500">未找到相关结果。</p>
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
        </div>
      ) : null}
    </section>
  );
}
