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
import { getRoleDisplayName } from '@/lib/adminLabels';
import {
  getRolePermissionMatrix,
  listAllUsers,
  listRoles,
  setRoleStatus,
  upsertRole,
} from '@/lib/api/admin_console';
import type { AdminRole, AdminRoleStatus, AdminUser } from '@/types/admin';

const ROLE_STATUS_OPTIONS: Array<{ label: string; value: AdminRoleStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

interface NoticeState {
  tone: 'success' | 'danger';
  title: string;
  description?: string;
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

export default function AdminRolesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AdminRoleStatus | 'all'>('all');
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, string[]>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, userList, matrix] = await Promise.all([
        listRoles({ q, status }),
        listAllUsers(),
        getRolePermissionMatrix({ include_inactive_permissions: true }),
      ]);

      setRoles(roleList);
      setUsers(userList);
      setPermissionMatrix(matrix.matrix);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = roles.filter((item) => item.status === 'active').length;
    const inactive = roles.length - active;
    const custom = roles.filter((item) => !item.builtin).length;
    return {
      total: roles.length,
      active,
      inactive,
      custom,
    };
  }, [roles]);

  const roleMemberCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const role of roles) {
      map.set(role.id, 0);
    }

    for (const user of users) {
      for (const roleId of user.role_ids) {
        map.set(roleId, (map.get(roleId) ?? 0) + 1);
      }
    }

    return map;
  }, [roles, users]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setDescription('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNotice({ tone: 'danger', title: '角色名称不能为空' });
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertRole({
        id: editingId ?? undefined,
        name: trimmed,
        description,
      });
      setNotice({
        tone: 'success',
        title: editingId ? '角色已更新' : '角色已创建',
        description: `${saved.name}（${saved.id}）已保存。`,
      });
      resetForm();
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setNotice({ tone: 'danger', title: '角色保存失败', description: message });
    } finally {
      setSaving(false);
    }
  }, [description, editingId, load, name, resetForm]);

  const toggleRole = useCallback(
    async (role: AdminRole) => {
      const nextStatus: AdminRoleStatus = role.status === 'active' ? 'inactive' : 'active';
      setSaving(true);
      try {
        await setRoleStatus(role.id, nextStatus);
        setNotice({
          tone: 'success',
          title: `${getRoleDisplayName(role)} 已${nextStatus === 'active' ? '启用' : '停用'}`,
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
      title="角色管理"
      subtitle="角色定义、启停与成员规模"
      metaText="支持角色 CRUD（内置角色可编辑但不允许删除）"
      badge="RBAC Roles"
      accent="#7C3AED"
    >
      <SectionCard title="筛选与概览" description="高风险角色建议最小化授权。">
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索角色名 / 描述 / ID"
              aria-label="搜索角色"
            />
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminRoleStatus | 'all')}
              aria-label="角色状态筛选"
            >
              {ROLE_STATUS_OPTIONS.map((option) => (
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
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
              <p className="text-xs text-violet-700">角色总数</p>
              <p className="mt-1 text-xl font-semibold text-violet-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">启用角色</p>
              <p className="mt-1 text-xl font-semibold text-emerald-900">{stats.active}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-700">停用角色</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{stats.inactive}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-xs text-sky-700">自定义角色</p>
              <p className="mt-1 text-xl font-semibold text-sky-900">{stats.custom}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={editingId ? '编辑角色' : '新增角色'}
        description="角色创建后可在“权限矩阵”页配置权限。"
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
            placeholder="例如：Taxonomy Editor"
            aria-label="角色名称"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="描述角色的职责边界"
            aria-label="角色描述"
          />
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {editingId ? '保存修改' : '新增角色'}
          </Button>
        </div>

        {notice ? (
          <div className="mt-3">
            <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={`角色列表（${roles.length}）`}>
        {loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : roles.length === 0 ? (
          <EmptyState title="暂无角色" description="请先创建一个角色。" />
        ) : (
          <Table
            head={(
              <tr>
                <th className="px-3 py-2">角色</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">成员数</th>
                <th className="px-3 py-2">权限数</th>
                <th className="px-3 py-2">更新时间</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            )}
            body={roles.map((role) => (
              <tr key={role.id} className="border-t border-slate-100">
                <td className="px-3 py-2 align-top">
                  <p className="text-sm font-semibold text-slate-900">{getRoleDisplayName(role)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{role.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                  {role.builtin ? <p className="mt-1 text-xs text-violet-600">内置角色</p> : null}
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge tone={role.status === 'active' ? 'success' : 'muted'}>
                    {role.status === 'active' ? '启用中' : '已停用'}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top text-sm text-slate-700">{roleMemberCount.get(role.id) ?? 0}</td>
                <td className="px-3 py-2 align-top text-sm text-slate-700">{permissionMatrix[role.id]?.length ?? 0}</td>
                <td className="px-3 py-2 align-top text-xs text-slate-500">
                  <p>{formatTime(role.updated_at)}</p>
                  <p className="mt-1">创建：{formatTime(role.created_at)}</p>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(role.id);
                        setName(role.name);
                        setDescription(role.description);
                        setNotice(null);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant={role.status === 'active' ? 'danger' : 'secondary'}
                      disabled={saving}
                      onClick={() => {
                        void toggleRole(role);
                      }}
                    >
                      {role.status === 'active' ? '停用' : '启用'}
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
