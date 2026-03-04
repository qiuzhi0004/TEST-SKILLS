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
import { getPermissionGroupLabel } from '@/lib/adminLabels';
import {
  getRolePermissionMatrix,
  listPermissionGroups,
  listPermissions,
  setPermissionStatus,
  upsertPermission,
} from '@/lib/api/admin_console';
import type {
  AdminPermission,
  AdminPermissionRisk,
  AdminPermissionStatus,
} from '@/types/admin';

const STATUS_OPTIONS: Array<{ label: string; value: AdminPermissionStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

const RISK_OPTIONS: Array<{ label: string; value: AdminPermissionRisk }> = [
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
];

interface NoticeState {
  tone: 'success' | 'danger';
  title: string;
  description?: string;
}

function toneForRisk(risk: AdminPermissionRisk) {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'warn';
  return 'danger';
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

export default function AdminPermissionsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AdminPermissionStatus | 'all'>('all');
  const [group, setGroup] = useState<string | 'all'>('all');

  const [items, setItems] = useState<AdminPermission[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [permissionRoleCount, setPermissionRoleCount] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formRisk, setFormRisk] = useState<AdminPermissionRisk>('medium');
  const [formDescription, setFormDescription] = useState('');

  const [notice, setNotice] = useState<NoticeState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [permissionList, groupList, matrix] = await Promise.all([
        listPermissions({ q, status, group }),
        listPermissionGroups(),
        getRolePermissionMatrix({ include_inactive_permissions: true }),
      ]);

      const counts: Record<string, number> = {};
      for (const role of matrix.roles) {
        const permissionIds = matrix.matrix[role.id] ?? [];
        for (const permissionId of permissionIds) {
          counts[permissionId] = (counts[permissionId] ?? 0) + 1;
        }
      }

      setItems(permissionList);
      setGroups(groupList);
      setPermissionRoleCount(counts);
    } finally {
      setLoading(false);
    }
  }, [group, q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status === 'active').length;
    const inactive = items.length - active;
    const highRisk = items.filter((item) => item.risk === 'high').length;
    return {
      total: items.length,
      active,
      inactive,
      highRisk,
    };
  }, [items]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormKey('');
    setFormName('');
    setFormGroup(groups[0] ?? '');
    setFormRisk('medium');
    setFormDescription('');
  }, [groups]);

  const handleSubmit = useCallback(async () => {
    if (!formKey.trim() || !formName.trim() || !formGroup.trim()) {
      setNotice({ tone: 'danger', title: '请填写完整的 key / 名称 / 分组' });
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertPermission({
        id: editingId ?? undefined,
        key: formKey.trim(),
        name: formName.trim(),
        group: formGroup.trim(),
        risk: formRisk,
        description: formDescription.trim(),
      });

      setNotice({
        tone: 'success',
        title: editingId ? '权限已更新' : '权限已创建',
        description: `${saved.name}（${saved.key}）已保存。`,
      });

      resetForm();
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : '权限保存失败';
      setNotice({ tone: 'danger', title: '权限保存失败', description: message });
    } finally {
      setSaving(false);
    }
  }, [editingId, formDescription, formGroup, formKey, formName, formRisk, load, resetForm]);

  const toggleStatus = useCallback(
    async (item: AdminPermission) => {
      const nextStatus: AdminPermissionStatus = item.status === 'active' ? 'inactive' : 'active';
      setSaving(true);
      try {
        await setPermissionStatus(item.id, nextStatus);
        setNotice({ tone: 'success', title: `${item.name} 已${nextStatus === 'active' ? '启用' : '停用'}` });
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
      title="权限管理"
      subtitle="权限定义、风险分级与角色覆盖"
      metaText="支持按分组筛选、按风险治理、按状态启停"
      badge="Permission Registry"
      accent="#9F1239"
    >
      <SectionCard title="筛选与概览" description="优先关注高风险权限的分配边界。">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_200px_auto]">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索权限 key / 名称 / 描述"
              aria-label="权限搜索"
            />
            <Select
              value={group}
              onChange={(event) => setGroup(event.target.value as string | 'all')}
              aria-label="权限分组筛选"
            >
              <option value="all">全部分组</option>
              {groups.map((item) => (
                <option key={item} value={item}>
                  {getPermissionGroupLabel(item)}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminPermissionStatus | 'all')}
              aria-label="权限状态筛选"
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs text-rose-700">权限总数</p>
              <p className="mt-1 text-xl font-semibold text-rose-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">启用权限</p>
              <p className="mt-1 text-xl font-semibold text-emerald-900">{stats.active}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-600">停用权限</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{stats.inactive}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">高风险权限</p>
              <p className="mt-1 text-xl font-semibold text-amber-900">{stats.highRisk}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={editingId ? '编辑权限' : '新增权限'}
        description="权限 key 建议采用命名空间形式：domain.action"
        headerRight={
          editingId ? (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              取消编辑
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px_180px_auto]">
          <Input
            value={formKey}
            onChange={(event) => setFormKey(event.target.value)}
            placeholder="例如：audit.export"
            aria-label="权限 key"
          />
          <Input
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
            placeholder="例如：导出审计日志"
            aria-label="权限名称"
          />
          <Input
            value={formGroup}
            onChange={(event) => setFormGroup(event.target.value)}
            placeholder="例如：audit"
            aria-label="权限分组"
          />
          <Select
            value={formRisk}
            onChange={(event) => setFormRisk(event.target.value as AdminPermissionRisk)}
            aria-label="权限风险等级"
          >
            {RISK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {editingId ? '保存修改' : '新增权限'}
          </Button>
        </div>

        <div className="mt-3">
          <Input
            value={formDescription}
            onChange={(event) => setFormDescription(event.target.value)}
            placeholder="描述权限用途与安全约束"
            aria-label="权限描述"
          />
        </div>

        {notice ? (
          <div className="mt-3">
            <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={`权限列表（${items.length}）`}>
        {loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : items.length === 0 ? (
          <EmptyState title="暂无匹配权限" description="请调整筛选条件或新增权限项。" />
        ) : (
          <Table
            head={(
              <tr>
                <th className="px-3 py-2">权限项</th>
                <th className="px-3 py-2">分组</th>
                <th className="px-3 py-2">风险</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">已绑定角色</th>
                <th className="px-3 py-2">更新时间</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            )}
            body={items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2 align-top">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.key}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </td>
                <td className="px-3 py-2 align-top text-xs text-slate-600">{getPermissionGroupLabel(item.group)}</td>
                <td className="px-3 py-2 align-top">
                  <Badge tone={toneForRisk(item.risk)}>
                    {item.risk === 'low' ? '低风险' : item.risk === 'medium' ? '中风险' : '高风险'}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge tone={item.status === 'active' ? 'success' : 'muted'}>
                    {item.status === 'active' ? '启用中' : '停用中'}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top text-sm text-slate-700">{permissionRoleCount[item.id] ?? 0}</td>
                <td className="px-3 py-2 align-top text-xs text-slate-500">{formatTime(item.updated_at)}</td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(item.id);
                        setFormKey(item.key);
                        setFormName(item.name);
                        setFormGroup(item.group);
                        setFormRisk(item.risk);
                        setFormDescription(item.description);
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
                        void toggleStatus(item);
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
