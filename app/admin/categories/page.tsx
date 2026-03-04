// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { setCategoryStatus, listCategories, upsertCategory } from '@/lib/api/admin_console';
import type { AdminCategory, AdminTaxonomyStatus } from '@/types/admin';

const STATUS_OPTIONS: Array<{ label: string; value: AdminTaxonomyStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  { label: '启用中', value: 'active' },
  { label: '已停用', value: 'inactive' },
];

function toneForStatus(status: AdminTaxonomyStatus) {
  return status === 'active' ? 'success' : 'muted';
}

interface NoticeState {
  tone: 'success' | 'danger' | 'info';
  title: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AdminTaxonomyStatus | 'all'>('all');
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState<NoticeState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listCategories({ q, status });
      setItems(next);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const active = items.filter((item) => item.status === 'active').length;
    const inactive = items.filter((item) => item.status === 'inactive').length;
    const usage = items.reduce((sum, item) => sum + item.usage_count, 0);
    return {
      total: items.length,
      active,
      inactive,
      usage,
    };
  }, [items]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setDescription('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNotice({ tone: 'danger', title: '分类名称不能为空' });
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertCategory({
        id: editingId ?? undefined,
        name: trimmed,
        description: description.trim(),
      });
      setNotice({
        tone: 'success',
        title: editingId ? '分类已更新' : '分类已创建',
        description: `${saved.name}（${saved.id}）已保存。`,
      });
      resetForm();
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试';
      setNotice({ tone: 'danger', title: '操作失败', description: message });
    } finally {
      setSaving(false);
    }
  }, [description, editingId, load, name, resetForm]);

  const handleToggleStatus = useCallback(
    async (item: AdminCategory) => {
      const nextStatus: AdminTaxonomyStatus = item.status === 'active' ? 'inactive' : 'active';
      setSaving(true);
      try {
        await setCategoryStatus(item.id, nextStatus);
        setNotice({
          tone: 'success',
          title: nextStatus === 'active' ? '分类已启用' : '分类已停用',
          description: `${item.name} 状态已更新。`,
        });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : '状态更新失败';
        setNotice({ tone: 'danger', title: '状态更新失败', description: message });
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  return (
    <PageShell
      title="分类管理"
      subtitle="分类体系治理与启停控制"
      metaText="支持搜索、新增、编辑、启停与使用量巡检"
      badge="Taxonomy Console"
      accent="#0F766E"
    >
      <SectionCard title="筛选与概览" description="先过滤目标，再执行批量治理。">
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索分类名称或 ID"
              aria-label="搜索分类"
            />
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminTaxonomyStatus | 'all')}
              aria-label="分类状态筛选"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              刷新列表
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">分类总数</p>
              <p className="mt-1 text-xl font-semibold text-emerald-900">{totals.total}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-xs text-sky-700">启用中</p>
              <p className="mt-1 text-xl font-semibold text-sky-900">{totals.active}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-600">停用中</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{totals.inactive}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">覆盖内容数</p>
              <p className="mt-1 text-xl font-semibold text-amber-900">{totals.usage}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={editingId ? '编辑分类' : '新增分类'}
        description="保存后会自动写入事件日志。"
        headerRight={
          editingId ? (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              取消编辑
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：AI 编排"
            aria-label="分类名称"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="用于侧边导航与搜索聚合的说明文本"
            aria-label="分类描述"
          />
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {editingId ? '保存修改' : '新增分类'}
          </Button>
        </div>

        {notice ? (
          <div className="mt-3">
            <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={`分类列表（${items.length}）`}>
        {loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : items.length === 0 ? (
          <EmptyState title="暂无匹配分类" description="尝试调整筛选条件或新增一个分类。" />
        ) : (
          <Table
            head={(
              <tr>
                <th className="px-3 py-2">分类</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">使用量</th>
                <th className="px-3 py-2">更新时间</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            )}
            body={items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2 align-top">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.id}</p>
                  {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge tone={toneForStatus(item.status)}>
                    {item.status === 'active' ? '启用中' : '停用中'}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top text-sm text-slate-700">{item.usage_count}</td>
                <td className="px-3 py-2 align-top text-xs text-slate-500">{item.updated_at}</td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(item.id);
                        setName(item.name);
                        setDescription(item.description);
                        setNotice(null);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === 'active' ? 'danger' : 'secondary'}
                      disabled={saving}
                      onClick={() => {
                        void handleToggleStatus(item);
                      }}
                    >
                      {item.status === 'active' ? '停用' : '启用'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          />
        )}
      </SectionCard>
    </PageShell>
  );
}
