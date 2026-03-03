'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
import { Select } from '@/components/ui/Select';
import type { ContentSummaryVM, ContentType } from '@/types/content';

type ListType = Extract<ContentType, 'prompt' | 'mcp' | 'skill' | 'tutorial'>;
type SortValue = 'hot_score' | 'created_at' | 'views_7d';
type OrderValue = 'asc' | 'desc';
type StatusValue = '' | 'verified';

interface ResourceListPageConfig {
  type: ListType;
  categoryOptions?: string[];
  toolOptions?: string[];
  matchCategory?: (item: ContentSummaryVM, category: string) => boolean;
  matchTool?: (item: ContentSummaryVM, tool: string) => boolean;
  showFilters?: boolean;
  showSidebarCategoryFilter?: boolean;
  mediaTabs?: string[];
  defaultMediaTab?: string;
}

const SORT_VALUES: SortValue[] = ['hot_score', 'created_at', 'views_7d'];
const ORDER_VALUES: OrderValue[] = ['asc', 'desc'];
const VERIFIED_STATUS = 'Listed';
const PUBLIC_VISIBLE_STATUS = 'Listed';

function isSortValue(value: string | null): value is SortValue {
  return value !== null && SORT_VALUES.includes(value as SortValue);
}

function isOrderValue(value: string | null): value is OrderValue {
  return value !== null && ORDER_VALUES.includes(value as OrderValue);
}

function normalizeText(input: string): string {
  return input.toLowerCase().trim();
}

function defaultCategoryMatcher(item: ContentSummaryVM, category: string): boolean {
  const haystack = normalizeText(`${item.title} ${item.one_liner ?? ''} ${item.tag_ids.join(' ')}`);
  return haystack.includes(normalizeText(category));
}

function defaultToolMatcher(item: ContentSummaryVM, tool: string): boolean {
  const haystack = normalizeText(`${item.title} ${item.one_liner ?? ''} ${item.tag_ids.join(' ')}`);
  return haystack.includes(normalizeText(tool));
}

function calcHotScore(item: ContentSummaryVM): number {
  return item.stats_7d.views * 1 + item.stats_7d.up * 5 + item.stats_7d.comments * 3;
}

function sortItems(items: ContentSummaryVM[], sort: SortValue, order: OrderValue): ContentSummaryVM[] {
  const sorted = [...items].sort((a, b) => {
    if (sort === 'created_at') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sort === 'views_7d') {
      return a.stats_7d.views - b.stats_7d.views;
    }
    return calcHotScore(a) - calcHotScore(b);
  });

  if (order === 'desc') {
    sorted.reverse();
  }
  return sorted;
}

export function ResourceListPage({ config }: { config: ResourceListPageConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showFilters = config.showFilters ?? true;
  const showSidebarCategoryFilter = config.showSidebarCategoryFilter ?? true;
  const categoryOptions = config.categoryOptions ?? [];
  const mediaTabs = config.mediaTabs ?? [];
  const defaultMediaTab = config.defaultMediaTab ?? mediaTabs[0] ?? '';

  const q = searchParams.get('q')?.trim() ?? '';
  const sort: SortValue = isSortValue(searchParams.get('sort'))
    ? (searchParams.get('sort') as SortValue)
    : 'hot_score';
  const order: OrderValue = isOrderValue(searchParams.get('order'))
    ? (searchParams.get('order') as OrderValue)
    : 'desc';
  const status: StatusValue = showFilters && searchParams.get('status') === 'verified' ? 'verified' : '';
  const category = showFilters && categoryOptions.includes(searchParams.get('categories') ?? '')
    ? (searchParams.get('categories') ?? '')
    : '';
  const mediaTab = mediaTabs.includes(searchParams.get('media') ?? '')
    ? (searchParams.get('media') ?? '')
    : defaultMediaTab;

  const tools = useMemo(
    () => (showFilters ? searchParams.getAll('tool') : []).filter((tool) => config.toolOptions?.includes(tool)),
    [config.toolOptions, searchParams, showFilters],
  );
  const toolsKey = tools.join('|');

  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const updateUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const onSubmitSearch = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const value = searchInput.trim();
      updateUrl((params) => {
        if (value) params.set('q', value);
        else params.delete('q');
      });
    },
    [searchInput, updateUrl],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void listContents({
      type: config.type,
      q,
      sort,
      order,
      offset: 0,
      limit: 200,
    })
      .then((res) => {
        if (cancelled) return;

        let filtered = res.items.filter((item) => item.status === PUBLIC_VISIBLE_STATUS);
        if (status === 'verified') {
          filtered = filtered.filter((item) => item.status === VERIFIED_STATUS);
        }

        const activeCategory = mediaTab || category;
        if (activeCategory) {
          const categoryMatcher = config.matchCategory ?? defaultCategoryMatcher;
          filtered = filtered.filter((item) => categoryMatcher(item, activeCategory));
        }

        if (tools.length > 0) {
          const toolMatcher = config.matchTool ?? defaultToolMatcher;
          filtered = filtered.filter((item) => tools.some((tool) => toolMatcher(item, tool)));
        }

        setItems(sortItems(filtered, sort, order));
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError('加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, config, mediaTab, order, q, reloadTick, sort, status, tools, toolsKey]);

  const statusValue = status || 'all';
  const categoryValue = category || 'all';

  return (
    <section className="space-y-4 pb-6">
      <div className="mx-auto max-w-2xl">
        <form onSubmit={onSubmitSearch} className="relative">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索资源"
            aria-label="页内搜索"
            className="h-12 w-full rounded-full border border-slate-300 bg-white pl-5 pr-16 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          />
          <button
            type="submit"
            aria-label="执行搜索"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">排序区</h2>
            <div className="space-y-2">
              <Select
                aria-label="排序字段"
                value={sort}
                onChange={(event) =>
                  updateUrl((params) => {
                    params.set('sort', event.target.value);
                    if (!params.get('order')) params.set('order', 'desc');
                  })
                }
              >
                <option value="hot_score">热度</option>
                <option value="created_at">创建时间</option>
                <option value="views_7d">近7日浏览</option>
              </Select>
              <Select
                aria-label="排序方向"
                value={order}
                onChange={(event) => updateUrl((params) => params.set('order', event.target.value))}
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </Select>
            </div>
          </section>

          {showFilters ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">条件筛选区</h2>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs text-slate-500">状态</p>
                  <Select
                    aria-label="状态筛选"
                    value={statusValue}
                    onChange={(event) =>
                      updateUrl((params) => {
                        if (event.target.value === 'verified') params.set('status', 'verified');
                        else params.delete('status');
                      })
                    }
                  >
                    <option value="all">全部</option>
                    <option value="verified">已认证</option>
                  </Select>
                </div>

                {showSidebarCategoryFilter && categoryOptions.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs text-slate-500">分类</p>
                    <Select
                      aria-label="分类筛选"
                      value={categoryValue}
                      onChange={(event) =>
                        updateUrl((params) => {
                          if (event.target.value === 'all') params.delete('categories');
                          else params.set('categories', event.target.value);
                        })
                      }
                    >
                      <option value="all">全部</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}

                {config.toolOptions && config.toolOptions.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs text-slate-500">工具（多选）</p>
                    <div className="space-y-1.5">
                      {config.toolOptions.map((option) => {
                        const checked = tools.includes(option);
                        return (
                          <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                updateUrl((params) => {
                                  const next = new Set(params.getAll('tool'));
                                  if (checked) next.delete(option);
                                  else next.add(option);
                                  params.delete('tool');
                                  [...next].forEach((tool) => params.append('tool', tool));
                                })
                              }
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {mediaTabs.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {mediaTabs.map((tab) => {
                const active = tab === mediaTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => updateUrl((params) => params.set('media', tab))}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      active
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          ) : null}
          {loading ? <p className="text-sm text-slate-500">加载中…</p> : null}
          {error ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-rose-600">{error}</p>
              <button
                type="button"
                onClick={() => setReloadTick((value) => value + 1)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                重新加载
              </button>
            </div>
          ) : null}
          {!loading && !error && items.length === 0 ? <p className="text-sm text-slate-500">无结果</p> : null}
          {!loading && !error && items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  showStatus={false}
                  showTypeBadge={false}
                  hidePromptMediaTags={config.type === 'prompt'}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
