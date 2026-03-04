// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
  listRoles,
  listUsers,
  setUserRoles,
  setUserStatus,
} from '@/lib/api/admin_console';
import type { AdminPaginationMeta, AdminRole, AdminUser, AdminUserStatus } from '@/types/admin';

const PAGE_SIZE = 8;

const USER_STATUS_OPTIONS: Array<{ label: string; value: AdminUserStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  { label: '活跃', value: 'active' },
  { label: '待激活', value: 'invited' },
  { label: '已冻结', value: 'suspended' },
];

function toneForStatus(status: AdminUserStatus) {
  if (status === 'active') return 'success';
  if (status === 'invited') return 'info';
  return 'danger';
}

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

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AdminUserStatus | 'all'>('all');
  const [roleId, setRoleId] = useState<string | 'all'>('all');
  const [offset, setOffset] = useState(0);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [meta, setMeta] = useState<AdminPaginationMeta>({ offset: 0, limit: PAGE_SIZE, total: 0 });

  const [loading, setLoading] = useState(true);
  const [rowBusyUserId, setRowBusyUserId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, roleList] = await Promise.all([
        listUsers({ q, status, role_id: roleId, offset, limit: PAGE_SIZE }),
        listRoles(),
      ]);

      setUsers(usersRes.items);
      setMeta(usersRes.meta);
      setRoles(roleList);
      setSelectedIds((current) => current.filter((userId) => usersRes.items.some((item) => item.id === userId)));
    } finally {
      setLoading(false);
    }
  }, [offset, q, roleId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffset(0);
  }, [q, status, roleId]);

  const pageSelected = users.length > 0 && users.every((item) => selectedIds.includes(item.id));

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  const toggleRole = useCallback(
    async (user: AdminUser, targetRoleId: string) => {
      const nextRoleIds = user.role_ids.includes(targetRoleId)
        ? user.role_ids.filter((item) => item !== targetRoleId)
        : [...user.role_ids, targetRoleId];

      setRowBusyUserId(user.id);
      try {
        await setUserRoles(user.id, nextRoleIds);
        setNotice({
          tone: 'success',
          title: `已更新 ${user.nickname} 的角色`,
          description: `当前角色数量：${nextRoleIds.length}`,
        });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : '角色更新失败';
        setNotice({ tone: 'danger', title: '角色更新失败', description: message });
      } finally {
        setRowBusyUserId(null);
      }
    },
    [load],
  );

  const changeUserStatus = useCallback(
    async (userId: string, nextStatus: AdminUserStatus) => {
      setRowBusyUserId(userId);
      try {
        await setUserStatus(userId, nextStatus);
        setNotice({ tone: 'success', title: '用户状态已更新' });
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : '状态更新失败';
        setNotice({ tone: 'danger', title: '状态更新失败', description: message });
      } finally {
        setRowBusyUserId(null);
      }
    },
    [load],
  );

  const applyBatchStatus = useCallback(
    async (nextStatus: AdminUserStatus) => {
      if (selectedIds.length === 0) {
        setNotice({ tone: 'danger', title: '请先选择用户再执行批量操作' });
        return;
      }

      setBatchBusy(true);
      try {
        await Promise.all(selectedIds.map((userId) => setUserStatus(userId, nextStatus)));
        setNotice({
          tone: 'success',
          title: '批量操作完成',
          description: `已更新 ${selectedIds.length} 个用户。`,
        });
        setSelectedIds([]);
        await load();
      } catch (error) {
        const message = error instanceof Error ? error.message : '批量更新失败';
        setNotice({ tone: 'danger', title: '批量更新失败', description: message });
      } finally {
        setBatchBusy(false);
      }
    },
    [load, selectedIds],
  );

  return (
    <PageShell
      title="用户管理"
      subtitle="用户状态巡检与角色分配"
      metaText="支持关键字过滤、角色筛选、批量状态更新"
      badge="User Operations"
      accent="#1D4ED8"
    >
      <SectionCard title="筛选与批量操作" description="先筛选目标用户，再执行批量动作。">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_auto]">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="搜索昵称 / 邮箱 / 用户 ID"
              aria-label="用户搜索"
            />
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminUserStatus | 'all')}
              aria-label="用户状态筛选"
            >
              {USER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={roleId}
              onChange={(event) => setRoleId(event.target.value as string | 'all')}
              aria-label="用户角色筛选"
            >
              <option value="all">全部角色</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              刷新列表
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">已选择 {selectedIds.length} 人</Badge>
            <Button
              size="sm"
              variant="secondary"
              disabled={batchBusy}
              onClick={() => {
                void applyBatchStatus('active');
              }}
            >
              批量激活
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={batchBusy}
              onClick={() => {
                void applyBatchStatus('suspended');
              }}
            >
              批量冻结
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0 || batchBusy}
            >
              清空选择
            </Button>
          </div>
        </div>

        {notice ? (
          <div className="mt-3">
            <InlineNotice tone={notice.tone} title={notice.title} description={notice.description} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={`用户列表（${meta.total}）`}>
        {loading ? (
          <p className="text-sm text-slate-500">加载中...</p>
        ) : users.length === 0 ? (
          <EmptyState title="暂无匹配用户" description="请调整筛选条件后重试。" />
        ) : (
          <>
            <Table
              head={(
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="全选当前页"
                      checked={pageSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(users.map((item) => item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2">用户</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">角色</th>
                  <th className="px-3 py-2">最近活跃</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              )}
              body={users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`选择用户 ${user.nickname}`}
                      checked={selectedIds.includes(user.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds((current) => [...new Set([...current, user.id])]);
                        } else {
                          setSelectedIds((current) => current.filter((item) => item !== user.id));
                        }
                      }}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">{user.nickname}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.id}</p>
                  </td>

                  <td className="px-3 py-2">
                    <div className="space-y-2">
                      <Badge tone={toneForStatus(user.status)}>
                        {user.status === 'active' ? '活跃' : user.status === 'invited' ? '待激活' : '已冻结'}
                      </Badge>
                      <Select
                        value={user.status}
                        onChange={(event) => {
                          void changeUserStatus(user.id, event.target.value as AdminUserStatus);
                        }}
                        disabled={rowBusyUserId === user.id}
                        aria-label={`更新 ${user.nickname} 状态`}
                      >
                        <option value="active">活跃</option>
                        <option value="invited">待激活</option>
                        <option value="suspended">已冻结</option>
                      </Select>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {roles.map((role) => {
                        const selected = user.role_ids.includes(role.id);
                        return (
                          <button
                            key={`${user.id}-${role.id}`}
                            type="button"
                            className={[
                              'rounded-full border px-2 py-0.5 text-[11px] font-medium transition',
                              selected
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700',
                            ].join(' ')}
                            onClick={() => {
                              void toggleRole(user, role.id);
                            }}
                            disabled={rowBusyUserId === user.id}
                          >
                            {getRoleDisplayName(role)}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  <td className="px-3 py-2 text-xs text-slate-500">
                    <p>{formatTime(user.last_active_at)}</p>
                    <p className="mt-1">创建：{formatTime(user.created_at)}</p>
                  </td>

                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <p>
                第 {currentPage} / {totalPages} 页 · 共 {meta.total} 人
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                  disabled={meta.offset === 0}
                >
                  上一页
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  disabled={meta.offset + meta.limit >= meta.total}
                >
                  下一页
                </Button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="角色说明" description="用于辅助用户管理页快速理解权限边界。">
        <div className="grid gap-2 lg:grid-cols-2">
          {roles.map((role) => {
            const memberCount = users.filter((user) => user.role_ids.includes(role.id)).length;
            return (
              <div key={role.id} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{getRoleDisplayName(role)}</p>
                  <Badge tone={role.status === 'active' ? 'success' : 'muted'}>
                    {role.status === 'active' ? '启用' : '停用'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                <p className="mt-2 text-xs text-slate-600">当前页成员：{memberCount} 人</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </PageShell>
  );
}
