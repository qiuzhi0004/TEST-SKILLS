import Image from 'next/image';
import Link from 'next/link';
import { listContents } from '@/lib/api';
import { pickUnsplash } from '@/lib/visualAssets';
import type { ContentSummaryVM, ContentType } from '@/types/content';

const RANK_COLUMNS: Array<{ type: Exclude<ContentType, 'all'>; title: string; accent: string; soft: string }> = [
  { type: 'prompt', title: 'Prompt', accent: '#FC6624', soft: '#FFF1EA' },
  { type: 'skill', title: 'Skill', accent: '#0F766E', soft: '#EAF9F5' },
  { type: 'mcp', title: 'MCP', accent: '#2563EB', soft: '#EDF4FF' },
  { type: 'tutorial', title: '社区', accent: '#7B3DA9', soft: '#F8ECFF' },
];

function toRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '').trim();
  if (value.length !== 6) return `rgba(15,23,42,${alpha})`;
  const num = Number.parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function scoreOf(item: ContentSummaryVM): number {
  return item.stats_7d.hot_score;
}

function formatCompact(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return `${value}`;
}

async function fetchTop10(type: Exclude<ContentType, 'all'>): Promise<ContentSummaryVM[]> {
  const res = await listContents({ type, offset: 0, limit: 80 });
  return res.items
    .filter((item) => item.status === 'Listed')
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, 10);
}

function detailPath(type: Exclude<ContentType, 'all'>, id: string): string {
  if (type === 'tutorial') return `/tutorials/${id}`;
  return `/${type}s/${id}`;
}

function rankMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}`;
}

export default async function RanksPage() {
  const topLists = await Promise.all(RANK_COLUMNS.map((column) => fetchTop10(column.type)));
  const merged = topLists.flat();
  const hottest = [...merged].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 5);
  const totalViews = merged.reduce((sum, item) => sum + item.stats_7d.views, 0);
  const totalInteractions = merged.reduce((sum, item) => sum + item.stats_7d.up + item.stats_7d.comments, 0);
  const avgHot = merged.length > 0 ? Math.round(merged.reduce((sum, item) => sum + scoreOf(item), 0) / merged.length) : 0;

  return (
    <div className="relative space-y-4 overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(252,102,36,0.12),transparent_36%),radial-gradient(circle_at_88%_24%,rgba(37,99,235,0.14),transparent_42%),radial-gradient(circle_at_50%_94%,rgba(123,61,169,0.12),transparent_38%),linear-gradient(180deg,#f7f8fb_0%,#eef2f8_100%)] p-3 sm:p-4">
      <div className="pointer-events-none absolute -left-28 top-52 h-72 w-72 rounded-full bg-[#FC6624]/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-72 h-80 w-80 rounded-full bg-[#2563EB]/16 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-[58%] h-64 w-64 rounded-full bg-violet-300/16 blur-3xl" />
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src={pickUnsplash('ranks:hero', 'prompt')}
            alt="榜单背景"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/86 via-slate-900/62 to-[#FC6624]/34" />
        </div>

        <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
          <div>
            <p className="inline-flex rounded-full border border-[#FC6624]/60 bg-[#FC6624]/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-white">
              Ranking Board
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">全站热度榜</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-200">按近 7 天热度综合排序，帮助你快速发现当前高价值资源。</p>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-white/25 bg-white/12 backdrop-blur-md">
            <div className="relative h-28 w-full">
              <Image
                src={pickUnsplash('ranks:snapshot', 'mcp')}
                alt="榜单快照背景"
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
                  <p className="text-[11px] text-slate-200">样本</p>
                  <p className="mt-1 text-base font-semibold">{merged.length}</p>
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
              <p className="text-xs text-slate-200">平均热度：{formatCompact(avgHot)}</p>
            </div>
          </aside>
        </div>
      </section>

      {hottest.length > 0 ? (
        <section className="relative overflow-hidden rounded-2xl border border-white/65 bg-white/42 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#FC6624]/18 blur-2xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-20 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_45%,rgba(255,255,255,0.22)_100%)]" />
          <p className="relative mb-2 text-xs font-medium tracking-wide text-slate-500">全站热榜 Top 5</p>
          <div className="relative grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {hottest.map((item, index) => (
              <Link
                key={`${item.type}:${item.id}`}
                href={detailPath(item.type, item.id)}
                className="rounded-lg border border-white/75 bg-white/66 px-3 py-2 text-sm text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.09)] backdrop-blur-md transition hover:-translate-y-1 hover:border-white hover:bg-white/86 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
              >
                <p className="text-xs text-slate-500">{rankMedal(index)} · {item.type.toUpperCase()}</p>
                <p className="mt-1 line-clamp-2 font-medium text-slate-900">{item.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-white/65 bg-white/42 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-5">
        <div className="pointer-events-none absolute -left-24 top-20 h-52 w-52 rounded-full bg-violet-300/14 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-cyan-300/16 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_48%,rgba(255,255,255,0.2)_100%)]" />
        <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {RANK_COLUMNS.map((column, columnIndex) => {
            const items = topLists[columnIndex];
            const glow = toRgba(column.accent, 0.22);
            return (
              <section
                key={column.type}
                className="relative overflow-hidden rounded-xl border border-white/70 bg-white/52 p-3 shadow-[0_14px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: glow }} />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0)_50%)]" />
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="relative text-sm font-semibold text-slate-900">{column.title}</h3>
                  <span
                    className="relative rounded-full border px-2 py-0.5 text-xs font-medium shadow-[0_6px_16px_rgba(15,23,42,0.10)] backdrop-blur-md"
                    style={{ borderColor: `${column.accent}66`, backgroundColor: `${column.accent}1f`, color: column.accent }}
                  >
                    Top 10
                  </span>
                </div>

                <div className="space-y-1.5">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <Link
                        key={item.id}
                        href={detailPath(column.type, item.id)}
                        className="group relative flex items-start gap-2 overflow-hidden rounded-lg border border-white/80 bg-white/68 px-2.5 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-md transition hover:-translate-y-1 hover:border-white hover:bg-white/88 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                      >
                        <div
                          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 opacity-0 transition group-hover:opacity-100"
                          style={{ background: `linear-gradient(180deg, ${toRgba(column.accent, 0.95)} 0%, ${toRgba(column.accent, 0.55)} 100%)` }}
                        />
                        <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/90 px-1 text-xs text-slate-600">
                          {rankMedal(index)}
                        </span>
                        <span className="line-clamp-2 text-sm text-slate-700">{item.title}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-white/80 bg-white/66 p-3 text-xs text-slate-500 backdrop-blur-md">
                      暂无上榜内容
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
