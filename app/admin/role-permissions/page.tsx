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
import { getPermissionGroupLabel, getRoleDisplayName } from '@/lib/adminLabels';
import {
  getRolePermissionMatrix,
  listPermissionGroups,
  setRolePermissions,
} from '@/lib/api/admin_console';
import type { AdminPermission, AdminRole } from '@/types/admin';

interface NoticeState {
  tone: 'success' | 'danger' | 'info';
  title: string;
  description?: string;
}

function toneForRisk(risk: AdminPermission['risk']) {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'warn';
  return 'danger';
}

export default function AdminRolePermissionsPage() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | 'all'>('all');

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [groups, setGroups] = useState<string[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matrixRes, groupList] = await Promise.all([
        getRolePermissionMatrix({ group }),
        listPermissionGroups(),
      ]);

      setRoles(matrixRes.roles);
      setPermissions(matrixRes.permissions);
      setMatrix(matrixRes.matrix);
      setGroups(groupList);

      const firstRoleId = matrixRes.roles[0]?.id ?? '';
      setSelectedRoleId((current) => {
        if (current && matrixRes.roles.some((item) => item.id === current)) {
          return current;
        }
        return firstRoleId;
      });
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedRoleId) {
      setDraftPermissionIds([]);
      return;
    }

    setDraftPermissionIds(matrix[selectedRoleId] ?? []);
  }, [matrix, selectedRoleId]);

  const visiblePermissions = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) {
      return permissions;
    }

    return permissions.filter((item) => `${item.key} ${item.name} ${item.description}`.toLowerCase().includes(keyword));
  }, [permissions, q]);

  const selectedRole = useMemo(
    () => roles.find((item) => item.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const selectedRoleDisplayName = useMemo(
    () => (selectedRole ? getRoleDisplayName(selectedRole) : selectedRoleId),
    [selectedRole, selectedRoleId],
  );

  const savedPermissionIds = useMemo(() => matrix[selectedRoleId] ?? [], [matrix, selectedRoleId]);
  const hasChanges = useMemo(() => {
    const current = new Set(savedPermissionIds);
    const draft = new Set(draftPermissionIds);
    if (current.size !== draft.size) {
      return true;
    }

    for (const permissionId of current) {
      if (!draft.has(permissionId)) {
        return true;
      }
    }

    return false;
  }, [draftPermissionIds, savedPermissionIds]);

  const riskStats = useMemo(() => {
    const selected = new Set(draftPermissionIds);
    const highRiskSelected = visiblePermissions.filter((item) => item.risk === 'high' && selected.has(item.id)).length;
    return {
      total: visiblePermissions.length,
      selected: draftPermissionIds.length,
      highRiskSelected,
    };
  }, [draftPermissionIds, visiblePermissions]);

  const togglePermission = useCallback((permissionId: string) => {
    setDraftPermissionIds((current) => {
      if (current.includes(permissionId)) {
        return current.filter((item) => item !== permissionId);
      }
      return [...current, permissionId];
    });
  }, []);

  const selectVisible = useCallback(() => {
    setDraftPermissionIds((current) => {
      const next = new Set(current);
      for (const permission of visiblePermissions) {
        next.add(permission.id);
      }
      return [...next];
    });
  }, [visiblePermissions]);

  const clearVisible = useCallback(() => {
    const visibleSet = new Set(visiblePermissions.map((item) => item.id));
    setDraftPermissionIds((current) => current.filter((item) => !visibleSet.has(item)));
  }, [visiblePermissions]);

  const resetToSaved = useCallback(() => {
    setDraftPermissionIds(savedPermissionIds);
    setNotice({ tone: 'info', title: '已回滚到当前保存版本' });
  }, [savedPermissionIds]);

  const save = useCallback(async () => {
    if (!selectedRoleId) {
      setNotice({ tone: 'danger', title: '请先选择角色' });
      return;
    }

    setSaving(true);
    try {
      await setRolePermissions(selectedRoleId, draftPermissionIds);
        setNotice({
          tone: 'success',
          title: '权限矩阵已保存',
          description: `${selectedRoleDisplayName} 当前授权 ${draftPermissionIds.length} 项。`,
        });
        await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败';
      setNotice({ tone: 'danger', title: '保存失败', description: message });
    } finally {
      setSaving(false);
    }
  }, [draftPermissionIds, load, selectedRoleDisplayName, selectedRoleId]);

  return (
    <PageShell
      title="权限矩阵"
      subtitle="角色-权限映射编辑"
      metaText="支持分组筛选、批量勾选、变更回滚与提交"
      badge="Role Matrix"
      accent="#0D9488"
    >
      <SectionCard title="矩阵筛选" description="选择角色后再调整权限映射。">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[260px_220px_minmax(0,1fr)_auto]">
            <Select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              aria-label="选择角色"
            >
              {roles.length === 0 ? <option value="">暂无角色</option> : null}
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </Select>
            <Select value={group} onChange={(event) => setGroup(event.target.value as string | 'all')} aria-label="权限分组筛选">
              <option value="all">全部分组</option>
              {groups.map((item) => (
                <option key={item} value={item}>
                  {getPermissionGroupLabel(item)}
                </option>
              ))}
            </Select>
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索权限 key / 名称"
              aria-label="权限搜索"
            />
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              刷新数据
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">可见权限</p>
              <p className="mt-1 text-xl font-semibold text-emerald-900">{riskStats.total}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-xs text-sky-700">草稿已选</p>
              <p className="mt-1 text-xl font-semibold text-sky-900">{riskStats.selected}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-xs text-rose-700">高风险已选</p>
              <p className="mt-1 text-xl font-semibold text-rose-900">{riskStats.highRiskSelected}</p>
            </div>
          </div>
        </div>

        {notice ? (
          <div className="mt-3">
            <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title={selectedRole ? `矩阵编辑：${getRoleDisplayName(selectedRole)}` : '矩阵编辑'}
        description="勾选表示该角色拥有对应权限。"
        headerRight={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={selectVisible}>
              勾选当前筛选
            </Button>
            <Button size="sm" variant="secondary" onClick={clearVisible}>
              清空当前筛选
            </Button>
            <Button size="sm" variant="ghost" onClick={resetToSaved}>
              回滚草稿
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!hasChanges || saving}
              onClick={() => {
                void save();
              }}
            >
              保存矩阵
            </Button>
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : !selectedRole ? (
          <EmptyState title="暂无可配置角色" description="请先在角色管理页创建角色。" />
        ) : visiblePermissions.length === 0 ? (
          <EmptyState title="当前筛选下无权限项" description="请放宽筛选条件。" />
        ) : (
          <Table
            head={(
              <tr>
                <th className="px-3 py-2">授权</th>
                <th className="px-3 py-2">权限项</th>
                <th className="px-3 py-2">分组</th>
                <th className="px-3 py-2">风险</th>
              </tr>
            )}
            body={visiblePermissions.map((permission) => {
              const checked = draftPermissionIds.includes(permission.id);
              return (
                <tr key={permission.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`切换权限 ${permission.name}`}
                      checked={checked}
                      onChange={() => togglePermission(permission.id)}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm font-semibold text-slate-900">{permission.name}</p>
                    <p className="text-xs text-slate-500">{permission.key}</p>
                    <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-600">{getPermissionGroupLabel(permission.group)}</td>
                  <td className="px-3 py-2 align-top">
                    <Badge tone={toneForRisk(permission.risk)}>
                      {permission.risk === 'low' ? '低风险' : permission.risk === 'medium' ? '中风险' : '高风险'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          />
        )}
      </SectionCard>

      <SectionCard title="变更摘要" description="仅用于当前页面可见草稿，不代表已保存。">
        <div className="flex flex-wrap gap-2">
          <Badge tone={hasChanges ? 'warn' : 'success'}>{hasChanges ? '存在未保存变更' : '草稿已同步'}</Badge>
          <Badge tone="muted">当前角色：{selectedRole ? getRoleDisplayName(selectedRole) : '-'}</Badge>
          <Badge tone="muted">已保存权限数：{savedPermissionIds.length}</Badge>
          <Badge tone="muted">草稿权限数：{draftPermissionIds.length}</Badge>
        </div>
      </SectionCard>
    </PageShell>
  );
}
