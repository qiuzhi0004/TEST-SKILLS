'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { listAuditLogs } from '@/lib/api/audit';
import type { AuditAction, AuditLogItem } from '@/types/audit';
import type { ContentType } from '@/types/content';

const PAGE_SIZE = 12;

const ACTION_OPTIONS: Array<{ label: string; value: AuditAction | 'all' }> = [
  { label: '全部动作', value: 'all' },
  { label: 'approve', value: 'approve' },
  { label: 'reject', value: 'reject' },
  { label: 'list', value: 'list' },
  { label: 'unlist', value: 'unlist' },
  { label: 'rollback', value: 'rollback' },
  { label: 'admin_edit', value: 'admin_edit' },
  { label: 'rule_change', value: 'rule_change' },
];

const TARGET_TYPE_OPTIONS: Array<{ label: string; value: ContentType | 'all' }> = [
  { label: '全部对象', value: 'all' },
  { label: 'Prompt', value: 'prompt' },
  { label: 'MCP', value: 'mcp' },
  { label: 'Skill', value: 'skill' },
  { label: 'Tutorial', value: 'tutorial' },
];

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

interface NoticeState {
  tone: 'success' | 'danger';
  title: string;
  description?: string;
}

export function AuditLogExplorer() {
  const [actionType, setActionType] = useState<AuditAction | 'all'>('all');
  const [targetType, setTargetType] = useState<ContentType | 'all'>('all');
  const [actor, setActor] = useState<string | 'all'>('all');
  const [targetId, setTargetId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState({ offset: 0, limit: PAGE_SIZE, total: 0 });
  const [actors, setActors] = useState<string[]>([]);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, allRes] = await Promise.all([
        listAuditLogs({
          action_type: actionType,
          actor_user_id: actor,
          target_type: targetType === 'all' ? undefined : targetType,
          target_id: targetId.trim() || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          offset,
          limit: PAGE_SIZE,
        }),
        listAuditLogs({ limit: 500, offset: 0 }),
      ]);

      setItems(res.items);
      setMeta(res.meta);
      setActors([...new Set(allRes.items.map((item) => item.actor ?? 'admin-local'))].sort((a, b) => a.localeCompare(b)));
      setSelectedLogId((current) => {
        if (current && res.items.some((item) => item.id === current)) {
          return current;
        }
        return res.items[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [actionType, actor, dateFrom, dateTo, offset, targetId, targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffset(0);
  }, [actionType, actor, dateFrom, dateTo, targetId, targetType]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedLogId) ?? null,
    [items, selectedLogId],
  );

  const pageCount = Math.max(1, Math.ceil(meta.total / meta.limit));
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  const actionStats = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.action] = (acc[item.action] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const exportCurrentFilters = useCallback(async () => {
    try {
      const res = await listAuditLogs({
        action_type: actionType,
        actor_user_id: actor,
        target_type: targetType === 'all' ? undefined : targetType,
        target_id: targetId.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        offset: 0,
        limit: 1000,
      });

      const blob = new Blob([JSON.stringify(res.items, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      setNotice({
        tone: 'success',
        title: '导出完成',
        description: `已导出 ${res.items.length} 条审计日志。`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      setNotice({ tone: 'danger', title: '导出失败', description: message });
    }
  }, [actionType, actor, dateFrom, dateTo, targetId, targetType]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select value={actionType} onChange={(event) => setActionType(event.target.value as AuditAction | 'all')} aria-label="动作类型筛选">
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select value={targetType} onChange={(event) => setTargetType(event.target.value as ContentType | 'all')} aria-label="对象类型筛选">
          {TARGET_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select value={actor} onChange={(event) => setActor(event.target.value as string | 'all')} aria-label="操作人筛选">
          <option value="all">全部操作人</option>
          {actors.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Input
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          placeholder="target_id 精确匹配"
          aria-label="对象 ID"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="开始日期" />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="结束日期" />

        <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
          <Button className="whitespace-nowrap" variant="secondary" onClick={() => void load()} disabled={loading}>
            刷新
          </Button>
          <Button className="whitespace-nowrap" variant="primary" onClick={() => void exportCurrentFilters()}>
            导出
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="info">总命中：{meta.total}</Badge>
        {Object.entries(actionStats).map(([action, count]) => (
          <Badge key={action} tone="muted">
            {action}: {count}
          </Badge>
        ))}
      </div>

      {notice ? <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {loading ? (
            <p className="text-sm text-slate-500">加载中...</p>
          ) : items.length === 0 ? (
            <EmptyState title="暂无审计日志" description="请调整筛选条件后重试。" />
          ) : (
            <>
              <Table
                head={(
                  <tr>
                    <th className="px-3 py-2">时间</th>
                    <th className="px-3 py-2">动作</th>
                    <th className="px-3 py-2">对象</th>
                    <th className="px-3 py-2">状态流转</th>
                    <th className="px-3 py-2">操作人</th>
                  </tr>
                )}
                body={items.map((item) => {
                  const active = item.id === selectedLogId;
                  return (
                    <tr
                      key={item.id}
                      className={[
                        'cursor-pointer border-t border-slate-100 transition',
                        active ? 'bg-blue-50/70' : 'hover:bg-slate-50',
                      ].join(' ')}
                      onClick={() => setSelectedLogId(item.id)}
                    >
                      <td className="px-3 py-2 text-xs text-slate-500">{formatTime(item.at)}</td>
                      <td className="px-3 py-2 align-top">
                        <Badge tone="info">{item.action}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {item.target_type}
                        <br />
                        {item.target_id}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {(item.from_status ?? '-') + ' -> ' + (item.to_status ?? '-')}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{item.actor ?? 'admin-local'}</td>
                    </tr>
                  );
                })}
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <p>
                  第 {currentPage}/{pageCount} 页
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
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-800">日志详情</h3>
          {!selected ? (
            <p className="mt-3 text-sm text-slate-500">请选择左侧日志查看详情。</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-xs text-slate-500">动作</p>
                <Badge tone="info">{selected.action}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">时间</p>
                <p>{formatTime(selected.at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">对象</p>
                <p>
                  {selected.target_type} / {selected.target_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">状态变化</p>
                <p>
                  {selected.from_status ?? '-'}
                  {' -> '}
                  {selected.to_status ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">原因</p>
                <p>{selected.reason ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Meta</p>
                <pre className="mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(selected.meta ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
