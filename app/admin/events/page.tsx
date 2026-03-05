// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { getEventTargetLabel, getEventTypeLabel } from '@/lib/adminLabels';
import { listEventActors, listEvents } from '@/lib/api/admin_console';
import type { AdminEventLog, AdminEventType, AdminPaginationMeta } from '@/types/admin';

const PAGE_SIZE = 12;

const EVENT_TYPE_VALUES: AdminEventType[] = [
  'taxonomy.create',
  'taxonomy.update',
  'taxonomy.toggle',
  'system.seed',
];

const EVENT_TYPE_OPTIONS: Array<{ label: string; value: AdminEventType | 'all' }> = [
  { label: '全部类型', value: 'all' },
  ...EVENT_TYPE_VALUES.map((value) => ({ label: getEventTypeLabel(value), value })),
];

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

export default function AdminEventsPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<AdminEventType | 'all'>('all');
  const [actor, setActor] = useState<string | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);

  const [items, setItems] = useState<AdminEventLog[]>([]);
  const [meta, setMeta] = useState<AdminPaginationMeta>({ offset: 0, limit: PAGE_SIZE, total: 0 });
  const [actors, setActors] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, actorList] = await Promise.all([
        listEvents({
          q,
          type,
          actor,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          offset,
          limit: PAGE_SIZE,
        }),
        listEventActors(),
      ]);

      setItems(eventsRes.items);
      setMeta(eventsRes.meta);
      setActors(actorList);
      setSelectedEventId((current) => {
        if (current && eventsRes.items.some((item) => item.id === current)) {
          return current;
        }
        return eventsRes.items[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [actor, dateFrom, dateTo, offset, q, type]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffset(0);
  }, [actor, dateFrom, dateTo, q, type]);

  const selectedEvent = useMemo(
    () => items.find((item) => item.id === selectedEventId) ?? null,
    [items, selectedEventId],
  );

  const pageCount = Math.max(1, Math.ceil(meta.total / meta.limit));
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  const typeStats = useMemo(() => {
    return items.reduce<Partial<Record<AdminEventType, number>>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  return (
    <PageShell
      title="事件日志"
      subtitle="后台运营事件追踪（不含 PV）"
      metaText="支持类型、操作人、关键词与时间区间过滤"
      badge="事件时间线"
      accent="#0369A1"
    >
      <SectionCard title="过滤器" description="筛选出需要排查的事件轨迹。">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索摘要 / 载荷 / 目标 ID"
              aria-label="事件关键词"
            />
            <Select value={type} onChange={(event) => setType(event.target.value as AdminEventType | 'all')} aria-label="事件类型">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select value={actor} onChange={(event) => setActor(event.target.value as string | 'all')} aria-label="事件操作人">
              <option value="all">全部操作人</option>
              {actors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="开始日期" />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="结束日期" />
            <div className="sm:col-span-2 xl:col-span-1">
              <Button className="w-full whitespace-nowrap xl:w-auto" variant="secondary" onClick={() => void load()} disabled={loading}>
                刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="info">总命中：{meta.total}</Badge>
            {Object.entries(typeStats).map(([eventType, count]) => (
              <Badge key={eventType} tone="muted">
                {getEventTypeLabel(eventType as AdminEventType)}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard title={`事件列表（第 ${currentPage}/${pageCount} 页）`}>
          {loading ? (
            <p className="text-sm text-slate-500">加载中...</p>
          ) : items.length === 0 ? (
            <EmptyState title="暂无事件" description="调整筛选条件后重试。" />
          ) : (
            <>
              <Table
                head={(
                  <tr>
                    <th className="px-3 py-2">时间</th>
                    <th className="px-3 py-2">类型</th>
                    <th className="px-3 py-2">摘要</th>
                    <th className="px-3 py-2">操作人</th>
                  </tr>
                )}
                body={items.map((item) => {
                  const active = item.id === selectedEventId;
                  return (
                    <tr
                      key={item.id}
                      className={[
                        'cursor-pointer border-t border-slate-100 transition',
                        active ? 'bg-sky-50/70' : 'hover:bg-slate-50',
                      ].join(' ')}
                      onClick={() => setSelectedEventId(item.id)}
                    >
                      <td className="px-3 py-2 text-xs text-slate-500">{formatTime(item.at)}</td>
                      <td className="px-3 py-2 align-top">
                        <Badge tone="info">{getEventTypeLabel(item.type)}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-sm text-slate-800">{item.summary}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getEventTargetLabel(item.target_type)}
                          {item.target_id ? ` · ${item.target_id}` : ''}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{item.actor}</td>
                    </tr>
                  );
                })}
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <p>
                  偏移 {meta.offset} · 每页 {meta.limit}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={meta.offset === 0}
                    onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                  >
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={meta.offset + meta.limit >= meta.total}
                    onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="事件详情" description="点击左侧任意事件查看完整载荷。">
          {!selectedEvent ? (
            <EmptyState title="未选中事件" description="请从左侧列表选择事件。" />
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">时间</p>
                <p className="text-sm text-slate-800">{formatTime(selectedEvent.at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">类型</p>
                <Badge tone="info">{getEventTypeLabel(selectedEvent.type)}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">目标</p>
                <p className="text-sm text-slate-800">
                  {getEventTargetLabel(selectedEvent.target_type)}
                  {selectedEvent.target_id ? ` / ${selectedEvent.target_id}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">摘要</p>
                <p className="text-sm text-slate-800">{selectedEvent.summary}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">载荷</p>
                <pre className="mt-1 max-h-[280px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(selectedEvent.payload ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
