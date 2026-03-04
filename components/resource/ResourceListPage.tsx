'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { listContents } from '@/lib/api';
import { ResourceCard } from '@/components/resource/ResourceCard';
import { Select } from '@/components/ui/Select';
import { pickUnsplash } from '@/lib/visualAssets';
import type { ContentSummaryVM, ContentType } from '@/types/content';

type ListType = Extract<ContentType, 'prompt' | 'mcp' | 'skill' | 'tutorial'>;
type SortValue = 'hot_score' | 'created_at' | 'views_7d';
type OrderValue = 'asc' | 'desc';
type StatusValue = '' | 'verified';

interface ResourceListPageConfig {
  type: ListType;
  categoryOptions?: string[];
  toolOptions?: string[];
  categoryLabel?: string;
  toolLabel?: string;
  matchCategory?: (item: ContentSummaryVM, category: string) => boolean;
  matchTool?: (item: ContentSummaryVM, tool: string) => boolean;
  showFilters?: boolean;
  showSidebarCategoryFilter?: boolean;
  showCategoryCounts?: boolean;
  mediaTabs?: string[];
  defaultMediaTab?: string;
}

interface ListTheme {
  accent: string;
  accentSoft: string;
  accentText: string;
  overlay: string;
}

const SORT_VALUES: SortValue[] = ['hot_score', 'created_at', 'views_7d'];
const ORDER_VALUES: OrderValue[] = ['asc', 'desc'];
const VERIFIED_STATUS = 'Listed';
const PUBLIC_VISIBLE_STATUS = 'Listed';

const LIST_HEADLINE: Record<ListType, { title: string; subtitle: string; badge: string }> = {
  prompt: {
    title: 'Prompt 资源库',
    subtitle: '围绕文本、图像、视频三类 Prompt 聚合高质量范式，支持按场景快速检索。',
    badge: 'Prompt Gallery',
  },
  skill: {
    title: 'Skill 资源库',
    subtitle: '聚合可复用的 Agent Skill，覆盖研发、分析、自动化与团队协作场景。',
    badge: 'Skill Market',
  },
  mcp: {
    title: 'MCP 资源库',
    subtitle: '发现可落地的 MCP 服务和案例，按业务目标组合你的工具栈。',
    badge: 'MCP Directory',
  },
  tutorial: {
    title: '帖子广场',
    subtitle: '查看社区精选帖子，沉淀可复用方法并持续迭代。',
    badge: 'Community',
  },
};

const LIST_THEME: Record<ListType, ListTheme> = {
  prompt: {
    accent: '#FC6624',
    accentSoft: '#FFF1EA',
    accentText: '#C94F1D',
    overlay: 'linear-gradient(100deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.58) 48%, rgba(252,102,36,0.28) 100%)',
  },
  skill: {
    accent: '#0F766E',
    accentSoft: '#EAF9F5',
    accentText: '#0F5C56',
    overlay: 'linear-gradient(100deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.58) 48%, rgba(15,118,110,0.30) 100%)',
  },
  mcp: {
    accent: '#2563EB',
    accentSoft: '#EDF4FF',
    accentText: '#1D4EB8',
    overlay: 'linear-gradient(100deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.60) 48%, rgba(37,99,235,0.30) 100%)',
  },
  tutorial: {
    accent: '#FC6624',
    accentSoft: '#FFF1EA',
    accentText: '#C94F1D',
    overlay: 'linear-gradient(100deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.58) 48%, rgba(252,102,36,0.28) 100%)',
  },
};

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

function formatCompact(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return `${value}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return `rgba(148, 163, 184, ${alpha})`;
  const value = Number.parseInt(raw, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toDetailPath(type: ContentType, id: string): string {
  if (type === 'prompt') return `/prompts/${id}`;
  if (type === 'mcp') return `/mcps/${id}`;
  if (type === 'skill') return `/skills/${id}`;
  return `/tutorials/${id}`;
}

export function ResourceListPage({ config }: { config: ResourceListPageConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showFilters = config.showFilters ?? true;
  const showSidebarCategoryFilter = config.showSidebarCategoryFilter ?? true;
  const showCategoryCounts = config.showCategoryCounts ?? false;
  const categoryOptions = useMemo(() => config.categoryOptions ?? [], [config.categoryOptions]);
  const categoryLabel = config.categoryLabel ?? '分类';
  const toolLabel = config.toolLabel ?? '工具（多选）';
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

  const allowedTools = useMemo(() => config.toolOptions ?? [], [config.toolOptions]);
  const tools = useMemo(
    () => (showFilters && allowedTools.length > 0
      ? searchParams.getAll('tool').filter((tool) => allowedTools.includes(tool))
      : []),
    [allowedTools, searchParams, showFilters],
  );
  const toolsKey = tools.join('|');

  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState<ContentSummaryVM[]>([]);
  const [filterScopeItems, setFilterScopeItems] = useState<ContentSummaryVM[]>([]);
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

        if (tools.length > 0) {
          const toolMatcher = config.matchTool ?? defaultToolMatcher;
          filtered = filtered.filter((item) => tools.some((tool) => toolMatcher(item, tool)));
        }

        setFilterScopeItems(filtered);

        const activeCategory = mediaTab || category;
        if (activeCategory) {
          const categoryMatcher = config.matchCategory ?? defaultCategoryMatcher;
          filtered = filtered.filter((item) => categoryMatcher(item, activeCategory));
        }

        setItems(sortItems(filtered, sort, order));
      })
      .catch(() => {
        if (cancelled) return;
        setFilterScopeItems([]);
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

  const categoryStats = useMemo(() => {
    if (categoryOptions.length === 0) return [] as Array<{ label: string; count: number }>;
    const categoryMatcher = config.matchCategory ?? defaultCategoryMatcher;
    return categoryOptions
      .map((option) => ({
        label: option,
        count: filterScopeItems.filter((item) => categoryMatcher(item, option)).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [categoryOptions, config.matchCategory, filterScopeItems]);

  const categoryCounts = useMemo(() => {
    return new Map(categoryStats.map((item) => [item.label, item.count]));
  }, [categoryStats]);

  const spotlightItems = useMemo(() => {
    return [...items].sort((a, b) => calcHotScore(b) - calcHotScore(a)).slice(0, 6);
  }, [items]);

  const avgHotScore = useMemo(() => {
    if (filterScopeItems.length === 0) return 0;
    const total = filterScopeItems.reduce((sum, item) => sum + calcHotScore(item), 0);
    return Math.round(total / filterScopeItems.length);
  }, [filterScopeItems]);

  const header = LIST_HEADLINE[config.type];
  const theme = LIST_THEME[config.type];
  const heroImage = pickUnsplash(`list:${config.type}`, config.type);
  const heroAccentImage = pickUnsplash(`list:${config.type}:accent`, config.type);
  const panelHeaderGlow = `linear-gradient(180deg, ${hexToRgba(theme.accent, 0.11)} 0%, rgba(255,255,255,0) 100%)`;
  const panelShellBorder = '#d5dee9';
  const panelGroupBorder = '#d7e0eb';
  const panelItemBorder = '#d7e0eb';
  const panelSubtleBg = '#ffffff';
  const panelActiveBg = hexToRgba(theme.accent, 0.1);
  const panelActiveBorder = hexToRgba(theme.accent, 0.42);
  const selectClassName =
    'h-11 rounded-xl border-slate-300 bg-white px-3 text-[15px] font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.98)] transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0';

  const statusValue = status || 'all';
  const categoryValue = category || 'all';
  const dominantCategory = categoryStats[0];
  const activeFilterCount =
    (status ? 1 : 0) +
    (category ? 1 : 0) +
    tools.length +
    (mediaTabs.length > 0 && mediaTab !== defaultMediaTab ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <section className="space-y-4 bg-[#f6f7f9] p-3 pb-6 sm:p-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`${header.title} 背景图`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0" style={{ background: theme.overlay }} />
        </div>

        <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
          <div className="space-y-4">
            <div>
              <p
                className="inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em]"
                style={{ borderColor: `${theme.accent}99`, backgroundColor: `${theme.accent}33`, color: '#fff' }}
              >
                {header.badge}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{header.title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200">{header.subtitle}</p>
            </div>

            <form onSubmit={onSubmitSearch} className="relative max-w-3xl">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="搜索资源"
                aria-label="页内搜索"
                className="h-12 w-full rounded-xl border border-white/30 bg-white/92 pl-4 pr-16 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1"
              />
              <button
                type="submit"
                aria-label="执行搜索"
                className="absolute right-2 top-1/2 inline-flex h-8 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
              >
                搜索
              </button>
            </form>

            {showSidebarCategoryFilter && categoryStats.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateUrl((params) => params.delete('categories'))}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={categoryValue === 'all'
                    ? { borderColor: theme.accent, backgroundColor: theme.accentSoft, color: theme.accentText }
                    : { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(15,23,42,0.25)', color: '#f1f5f9' }}
                >
                  全部 {filterScopeItems.length}
                </button>
                {categoryStats.slice(0, 8).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => updateUrl((params) => params.set('categories', item.label))}
                    className="rounded-full border px-3 py-1 text-xs"
                    style={category === item.label
                      ? { borderColor: theme.accent, backgroundColor: theme.accentSoft, color: theme.accentText }
                      : { borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(15,23,42,0.25)', color: '#f1f5f9' }}
                  >
                    {item.label} {item.count}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="overflow-hidden rounded-2xl border border-white/25 bg-white/12 backdrop-blur-md">
            <div className="relative h-28 w-full">
              <Image
                src={heroAccentImage}
                alt="数据概览背景"
                fill
                sizes="320px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/55" />
            </div>
            <div className="space-y-3 p-4 text-white">
              <p className="text-xs tracking-[0.1em] text-slate-200">DATA SNAPSHOT</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/20 bg-black/15 p-2.5">
                  <p className="text-[11px] text-slate-200">已收录</p>
                  <p className="mt-1 text-lg font-semibold">{formatCompact(filterScopeItems.length)}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/15 p-2.5">
                  <p className="text-[11px] text-slate-200">当前结果</p>
                  <p className="mt-1 text-lg font-semibold">{formatCompact(items.length)}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/15 p-2.5">
                  <p className="text-[11px] text-slate-200">平均热度</p>
                  <p className="mt-1 text-lg font-semibold">{formatCompact(avgHotScore)}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/15 p-2.5">
                  <p className="text-[11px] text-slate-200">活跃筛选</p>
                  <p className="mt-1 text-lg font-semibold">{activeFilterCount}</p>
                </div>
              </div>

              <p className="text-xs text-slate-200">
                主分类：{dominantCategory ? `${dominantCategory.label}（${dominantCategory.count}）` : '暂无'}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50/75 p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
            style={{ borderColor: panelShellBorder }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12" style={{ background: panelHeaderGlow }} />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">结果排序</h2>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateUrl((params) => {
                        params.delete('status');
                        params.delete('categories');
                        params.delete('tool');
                        params.delete('media');
                      })
                    }
                    className="rounded-full border px-2.5 py-1 text-xs font-medium transition hover:-translate-y-0.5 hover:shadow-sm"
                    style={{ borderColor: panelActiveBorder, color: theme.accentText, backgroundColor: panelActiveBg }}
                  >
                    清空筛选
                  </button>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border p-3" style={{ borderColor: panelGroupBorder, backgroundColor: panelSubtleBg }}>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">排序字段</p>
                  <Select
                    aria-label="排序字段"
                    value={sort}
                    className={selectClassName}
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
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: panelGroupBorder, backgroundColor: panelSubtleBg }}>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">排序方向</p>
                  <Select
                    aria-label="排序方向"
                    value={order}
                    className={selectClassName}
                    onChange={(event) => updateUrl((params) => params.set('order', event.target.value))}
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {showFilters ? (
            <section
              className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50/75 p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              style={{ borderColor: panelShellBorder }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12" style={{ background: panelHeaderGlow }} />
              <div className="relative">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">条件筛选</h2>

                <div className="space-y-2.5">
                  <div className="rounded-xl border p-3" style={{ borderColor: panelGroupBorder, backgroundColor: panelSubtleBg }}>
                    <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">状态</p>
                    <Select
                      aria-label="状态筛选"
                      value={statusValue}
                      className={selectClassName}
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
                    <div className="rounded-xl border p-3" style={{ borderColor: panelGroupBorder, backgroundColor: panelSubtleBg }}>
                      <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">{categoryLabel}</p>
                      {showCategoryCounts ? (
                        <div className="space-y-1.5">
                          <label
                            className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition hover:border-slate-300"
                            style={categoryValue === 'all'
                              ? { borderColor: panelActiveBorder, backgroundColor: panelActiveBg, boxShadow: `inset 0 0 0 1px ${hexToRgba(theme.accent, 0.14)}` }
                              : { borderColor: panelItemBorder, backgroundColor: '#fff' }}
                          >
                            <span className="flex items-center gap-2 text-slate-700">
                              <input
                                type="radio"
                                name="category-filter"
                                checked={categoryValue === 'all'}
                                onChange={() => updateUrl((params) => params.delete('categories'))}
                                className="h-4 w-4 border-slate-300"
                                style={{ accentColor: theme.accent }}
                              />
                              全部
                            </span>
                            <span className="text-xs text-slate-400">{filterScopeItems.length}</span>
                          </label>
                          {categoryOptions.map((option) => {
                            const checked = category === option;
                            const count = categoryCounts.get(option) ?? 0;
                            return (
                              <label
                                key={option}
                                className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition hover:border-slate-300"
                                style={checked
                                  ? { borderColor: panelActiveBorder, backgroundColor: panelActiveBg, boxShadow: `inset 0 0 0 1px ${hexToRgba(theme.accent, 0.14)}` }
                                  : { borderColor: panelItemBorder, backgroundColor: '#fff' }}
                              >
                                <span className="flex items-center gap-2 text-slate-700">
                                  <input
                                    type="radio"
                                    name="category-filter"
                                    checked={checked}
                                    onChange={() =>
                                      updateUrl((params) => {
                                        params.set('categories', option);
                                      })
                                    }
                                    className="h-4 w-4 border-slate-300"
                                    style={{ accentColor: theme.accent }}
                                  />
                                  {option}
                                </span>
                                <span className="text-xs text-slate-400">{count}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <Select
                          aria-label="分类筛选"
                          value={categoryValue}
                          className={selectClassName}
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
                      )}
                    </div>
                  ) : null}

                  {allowedTools.length > 0 ? (
                    <div className="rounded-xl border p-3" style={{ borderColor: panelGroupBorder, backgroundColor: panelSubtleBg }}>
                      <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">{toolLabel}</p>
                      <div className="space-y-1.5">
                        {allowedTools.map((option) => {
                          const checked = tools.includes(option);
                          return (
                            <label
                              key={option}
                              className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition hover:border-slate-300"
                              style={checked
                                ? { borderColor: panelActiveBorder, backgroundColor: panelActiveBg, boxShadow: `inset 0 0 0 1px ${hexToRgba(theme.accent, 0.14)}` }
                                : { borderColor: panelItemBorder, backgroundColor: '#fff' }}
                            >
                              <span className="flex items-center gap-2 text-slate-700">
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
                                  className="h-4 w-4 rounded border-slate-300"
                                  style={{ accentColor: theme.accent }}
                                />
                                {option}
                              </span>
                              {checked ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                  style={{ color: theme.accentText, backgroundColor: theme.accentSoft }}
                                >
                                  已选
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              当前结果：<span className="font-medium text-slate-700">{items.length}</span>
              <span className="mx-1 text-slate-300">|</span>
              热门候选：<span className="font-medium text-slate-700">{spotlightItems.length}</span>
            </p>

            {mediaTabs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mediaTabs.map((tab) => {
                  const active = tab === mediaTab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => updateUrl((params) => params.set('media', tab))}
                      className="rounded-full border px-3 py-1 text-sm transition"
                      style={active
                        ? { borderColor: theme.accent, backgroundColor: theme.accentSoft, color: theme.accentText }
                        : { borderColor: '#CBD5E1', backgroundColor: '#fff', color: '#334155' }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {!loading && !error && spotlightItems.length > 0 ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">热点速览</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {spotlightItems.slice(0, 6).map((item, index) => (
                  <Link
                    key={item.id}
                    href={toDetailPath(item.type, item.id)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1">{item.title}</span>
                  </Link>
                ))}
              </div>
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
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
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
