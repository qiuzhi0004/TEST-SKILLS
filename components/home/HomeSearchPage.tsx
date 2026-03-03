'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import type { ContentSummaryVM, ContentType } from '@/types/content';

type SupportedType = Extract<ContentType, 'prompt' | 'skill' | 'mcp'>;

interface SearchCardVM {
  id: string;
  title: string;
  type: 'Prompt' | 'Skill' | 'MCP';
  summary: string;
  tags: string[];
  href: string;
}

const SUPPORTED_TYPES: SupportedType[] = ['prompt', 'skill', 'mcp'];

function isSupportedType(type: ContentType): type is SupportedType {
  return SUPPORTED_TYPES.includes(type as SupportedType);
}

function getTypeLabel(type: SupportedType): SearchCardVM['type'] {
  if (type === 'prompt') return 'Prompt';
  if (type === 'skill') return 'Skill';
  return 'MCP';
}

function getDetailHref(type: SupportedType, id: string): string {
  if (type === 'prompt') return `/prompts/${id}`;
  if (type === 'skill') return `/skills/${id}`;
  return `/mcps/${id}`;
}

function mapToSearchCards(items: ContentSummaryVM[]): SearchCardVM[] {
  const cards: SearchCardVM[] = [];
  for (const item of items) {
    if (!isSupportedType(item.type)) {
      continue;
    }
    cards.push({
      id: item.id,
      title: item.title,
      type: getTypeLabel(item.type),
      summary: item.one_liner?.trim() || '暂无简介',
      tags: item.tag_ids,
      href: getDetailHref(item.type, item.id),
    });
  }
  return cards;
}

export function HomeSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryInUrl = useMemo(() => searchParams.get('q')?.trim() ?? '', [searchParams]);
  const [inputValue, setInputValue] = useState(queryInUrl);
  const [cards, setCards] = useState<SearchCardVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(queryInUrl));

  useEffect(() => {
    setInputValue(queryInUrl);
  }, [queryInUrl]);

  useEffect(() => {
    if (!queryInUrl) {
      setCards([]);
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
        setCards(mapToSearchCards(res.items));
      })
      .catch(() => {
        if (cancelled) return;
        setCards([]);
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
          {!loading && !error && cards.length === 0 ? (
            <p className="text-center text-sm text-slate-500">未找到相关结果。</p>
          ) : null}
          {!loading && !error && cards.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <Link
                  key={`${card.type}:${card.id}`}
                  href={card.href}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-1 text-sm font-semibold text-slate-900">{card.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {card.type}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{card.summary}</p>
                  {card.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {card.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-4 text-xs text-slate-500 group-hover:text-slate-700">查看详情</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
