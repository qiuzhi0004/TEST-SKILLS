import taxonomiesRaw from '@/data/taxonomies.json';
import { BUILTIN_ROLE_NAME_MAP } from '@/lib/adminLabels';
import { loadAdminConsoleState, saveAdminConsoleState } from '@/lib/client/storage_admin';
import type {
  AdminCategory,
  AdminConsoleState,
  AdminEventLog,
  AdminEventType,
  AdminPermission,
  AdminPermissionStatus,
  AdminRole,
  AdminRoleStatus,
  AdminTag,
  AdminTaxonomyStatus,
  AdminUser,
  AdminUserStatus,
  ListAdminEventsParams,
  ListAdminPermissionsParams,
  ListAdminRolesParams,
  ListAdminTaxonomiesParams,
  ListAdminUsersParams,
  AdminPaginationMeta,
} from '@/types/admin';

const taxonomies = taxonomiesRaw as {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

const DEFAULT_ACTOR = 'admin-local';

const DEFAULT_ROLES: AdminRole[] = [
  {
    id: 'role-super-admin',
    name: '超级管理员',
    description: '全局配置、审计导出与高风险操作控制。',
    builtin: true,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-content-admin',
    name: '内容管理员',
    description: '分类/标签治理，内容质量运营。',
    builtin: true,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-auditor',
    name: '审计员',
    description: '只读审计与事件追踪，支持复核。',
    builtin: true,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-ops',
    name: '运营管理员',
    description: '用户运营和角色分配执行。',
    builtin: true,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_PERMISSIONS: AdminPermission[] = [
  {
    id: 'perm-taxonomy-read',
    key: 'taxonomy.read',
    name: '查看分类标签',
    group: 'taxonomy',
    risk: 'low',
    description: '读取分类/标签和使用统计。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-taxonomy-write',
    key: 'taxonomy.write',
    name: '编辑分类标签',
    group: 'taxonomy',
    risk: 'medium',
    description: '新增、编辑、启停分类与标签。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-users-read',
    key: 'users.read',
    name: '查看用户',
    group: 'users',
    risk: 'low',
    description: '读取用户、角色和状态。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-users-status',
    key: 'users.status',
    name: '修改用户状态',
    group: 'users',
    risk: 'high',
    description: '邀请、激活、冻结等状态变更。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-users-role',
    key: 'users.role',
    name: '分配用户角色',
    group: 'users',
    risk: 'high',
    description: '调整用户角色集合。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-roles-read',
    key: 'roles.read',
    name: '查看角色',
    group: 'rbac',
    risk: 'low',
    description: '读取角色列表和成员统计。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-roles-write',
    key: 'roles.write',
    name: '编辑角色',
    group: 'rbac',
    risk: 'high',
    description: '新增、编辑、停用角色。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-permissions-read',
    key: 'permissions.read',
    name: '查看权限项',
    group: 'rbac',
    risk: 'low',
    description: '读取权限定义与分组。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-permissions-write',
    key: 'permissions.write',
    name: '编辑权限项',
    group: 'rbac',
    risk: 'high',
    description: '新增、编辑、停用权限项。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-matrix-write',
    key: 'matrix.write',
    name: '维护权限矩阵',
    group: 'rbac',
    risk: 'high',
    description: '维护角色与权限的绑定关系。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-events-read',
    key: 'events.read',
    name: '查看事件日志',
    group: 'audit',
    risk: 'medium',
    description: '查询后台操作事件。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-audit-read',
    key: 'audit.read',
    name: '查看审计日志',
    group: 'audit',
    risk: 'medium',
    description: '查询审计动作。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'perm-audit-export',
    key: 'audit.export',
    name: '导出审计日志',
    group: 'audit',
    risk: 'high',
    description: '导出审计结果用于复核。',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'role-super-admin': DEFAULT_PERMISSIONS.map((item) => item.id),
  'role-content-admin': [
    'perm-taxonomy-read',
    'perm-taxonomy-write',
    'perm-users-read',
    'perm-roles-read',
    'perm-permissions-read',
    'perm-events-read',
    'perm-audit-read',
  ],
  'role-auditor': ['perm-events-read', 'perm-audit-read', 'perm-audit-export', 'perm-users-read'],
  'role-ops': ['perm-users-read', 'perm-users-status', 'perm-users-role', 'perm-roles-read', 'perm-events-read'],
};

const DEFAULT_USERS: AdminUser[] = [
  {
    id: 'u_admin_01',
    nickname: 'Mina',
    email: 'mina@luzi.dev',
    status: 'active',
    role_ids: ['role-super-admin'],
    created_at: '2026-01-03T08:10:00.000Z',
    last_active_at: '2026-03-04T08:50:00.000Z',
  },
  {
    id: 'u_admin_02',
    nickname: 'Yu',
    email: 'yu@luzi.dev',
    status: 'active',
    role_ids: ['role-content-admin'],
    created_at: '2026-01-07T10:24:00.000Z',
    last_active_at: '2026-03-04T07:32:00.000Z',
  },
  {
    id: 'u_admin_03',
    nickname: 'Kira',
    email: 'kira@luzi.dev',
    status: 'active',
    role_ids: ['role-content-admin', 'role-ops'],
    created_at: '2026-01-09T12:41:00.000Z',
    last_active_at: '2026-03-04T05:24:00.000Z',
  },
  {
    id: 'u_admin_04',
    nickname: 'Felix',
    email: 'felix@luzi.dev',
    status: 'invited',
    role_ids: ['role-auditor'],
    created_at: '2026-02-10T02:10:00.000Z',
    last_active_at: '2026-03-03T22:03:00.000Z',
  },
  {
    id: 'u_admin_05',
    nickname: 'Cindy',
    email: 'cindy@luzi.dev',
    status: 'suspended',
    role_ids: ['role-ops'],
    created_at: '2026-02-18T16:32:00.000Z',
    last_active_at: '2026-02-28T03:00:00.000Z',
    notes: '因异常批量操作被临时冻结',
  },
  {
    id: 'u_admin_06',
    nickname: 'Rex',
    email: 'rex@luzi.dev',
    status: 'active',
    role_ids: ['role-auditor'],
    created_at: '2026-02-23T08:16:00.000Z',
    last_active_at: '2026-03-03T21:45:00.000Z',
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function toCount(seed: string, base: number, spread: number): number {
  return base + (hashString(seed) % spread);
}

function createSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

function ensureUniqueId(existingIds: Set<string>, baseId: string): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let serial = 2;
  while (existingIds.has(`${baseId}-${serial}`)) {
    serial += 1;
  }
  return `${baseId}-${serial}`;
}

function cloneState(state: AdminConsoleState): AdminConsoleState {
  return {
    categories: [...state.categories],
    tags: [...state.tags],
    users: state.users.map((item) => ({ ...item, role_ids: [...item.role_ids] })),
    roles: [...state.roles],
    permissions: [...state.permissions],
    role_permissions: Object.fromEntries(
      Object.entries(state.role_permissions).map(([roleId, permissionIds]) => [roleId, [...permissionIds]]),
    ),
    events: [...state.events],
  };
}

function appendEvent(
  state: AdminConsoleState,
  input: {
    actor?: string;
    type: AdminEventType;
    target_type: AdminEventLog['target_type'];
    target_id?: string;
    summary: string;
    payload?: Record<string, unknown>;
  },
): void {
  state.events.unshift({
    id: createId('event'),
    at: nowIso(),
    actor: input.actor ?? DEFAULT_ACTOR,
    type: input.type,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    payload: input.payload,
  });

  if (state.events.length > 400) {
    state.events = state.events.slice(0, 400);
  }
}

function buildSeededState(): AdminConsoleState {
  const now = nowIso();

  const categories: AdminCategory[] = taxonomies.categories.map((item, index) => ({
    id: item.id,
    name: item.name,
    parent_id: null,
    description: index % 2 === 0 ? '推荐用于导航一级分类。' : '用于内容聚合与筛选。',
    status: 'active',
    usage_count: toCount(item.id, 14, 120),
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: now,
  }));

  const tags: AdminTag[] = taxonomies.tags.map((item) => ({
    id: item.id,
    name: item.name,
    status: 'active',
    usage_count: toCount(item.id, 22, 160),
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: now,
  }));

  const state: AdminConsoleState = {
    categories,
    tags,
    users: DEFAULT_USERS.map((item) => ({ ...item, role_ids: [...item.role_ids] })),
    roles: DEFAULT_ROLES.map((item) => ({ ...item })),
    permissions: DEFAULT_PERMISSIONS.map((item) => ({ ...item })),
    role_permissions: Object.fromEntries(
      Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([roleId, permissionIds]) => [roleId, [...permissionIds]]),
    ),
    events: [],
  };

  appendEvent(state, {
    type: 'system.seed',
    target_type: 'system',
    summary: '初始化后台管理本地数据集。',
    payload: {
      categories: state.categories.length,
      tags: state.tags.length,
      users: state.users.length,
      roles: state.roles.length,
      permissions: state.permissions.length,
    },
  });

  return state;
}

function isSeeded(state: AdminConsoleState): boolean {
  return (
    state.categories.length > 0
    && state.tags.length > 0
    && state.users.length > 0
    && state.roles.length > 0
    && state.permissions.length > 0
  );
}

function localizeBuiltinRoleNames(state: AdminConsoleState): { state: AdminConsoleState; changed: boolean } {
  let changed = false;

  const nextRoles = state.roles.map((role) => {
    const localizedName = BUILTIN_ROLE_NAME_MAP[role.id];
    if (!localizedName || role.name === localizedName) {
      return role;
    }
    changed = true;
    return {
      ...role,
      name: localizedName,
    };
  });

  if (!changed) {
    return { state, changed: false };
  }

  return {
    state: {
      ...state,
      roles: nextRoles,
    },
    changed: true,
  };
}

function loadState(): AdminConsoleState {
  const existing = loadAdminConsoleState();

  if (isSeeded(existing)) {
    const localized = localizeBuiltinRoleNames(existing);
    if (localized.changed) {
      saveAdminConsoleState(localized.state);
    }
    return localized.state;
  }

  const seeded = buildSeededState();
  saveAdminConsoleState(seeded);
  return seeded;
}

function saveState(state: AdminConsoleState): void {
  saveAdminConsoleState(state);
}

function toSafePagination(offset = 0, limit = 20): AdminPaginationMeta {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  return {
    offset: safeOffset,
    limit: safeLimit,
    total: 0,
  };
}

function byUpdatedAtDesc<T extends { updated_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function byTimeDesc<T extends { at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.at.localeCompare(a.at));
}

function filterTaxonomyByQuery<T extends { id: string; name: string }>(items: T[], q: string): T[] {
  const keyword = q.trim().toLowerCase();
  if (!keyword) {
    return items;
  }

  return items.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(keyword));
}

function toBoundaryIso(date: string | undefined, end: boolean): string | null {
  if (!date) {
    return null;
  }

  const value = `${date}T${end ? '23:59:59.999' : '00:00:00.000'}Z`;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

function filterByDateRange<T extends { at: string }>(items: T[], dateFrom?: string, dateTo?: string): T[] {
  const from = toBoundaryIso(dateFrom, false);
  const to = toBoundaryIso(dateTo, true);

  return items.filter((item) => {
    if (from && item.at < from) {
      return false;
    }
    if (to && item.at > to) {
      return false;
    }
    return true;
  });
}

function sanitizeRoleIds(roleIds: string[], roles: AdminRole[]): string[] {
  const roleSet = new Set(roles.map((item) => item.id));
  const uniqueRoleIds = new Set<string>();

  for (const roleId of roleIds) {
    if (roleSet.has(roleId)) {
      uniqueRoleIds.add(roleId);
    }
  }

  return [...uniqueRoleIds];
}

function sanitizePermissionIds(permissionIds: string[], permissions: AdminPermission[]): string[] {
  const permissionSet = new Set(permissions.map((item) => item.id));
  const uniquePermissionIds = new Set<string>();

  for (const permissionId of permissionIds) {
    if (permissionSet.has(permissionId)) {
      uniquePermissionIds.add(permissionId);
    }
  }

  return [...uniquePermissionIds];
}

export async function listCategories(params: ListAdminTaxonomiesParams = {}): Promise<AdminCategory[]> {
  const state = loadState();

  const filtered = filterTaxonomyByQuery(state.categories, params.q ?? '')
    .filter((item) => (params.status && params.status !== 'all' ? item.status === params.status : true));

  return byUpdatedAtDesc(filtered);
}

export async function upsertCategory(input: {
  id?: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  actor?: string;
}): Promise<AdminCategory> {
  const state = cloneState(loadState());
  const name = input.name.trim();
  if (!name) {
    throw new Error('分类名称不能为空');
  }

  const existingIndex = input.id ? state.categories.findIndex((item) => item.id === input.id) : -1;
  const timestamp = nowIso();

  if (existingIndex >= 0) {
    const current = state.categories[existingIndex];
    const updated: AdminCategory = {
      ...current,
      name,
      description: input.description?.trim() ?? current.description,
      parent_id: input.parent_id ?? current.parent_id,
      updated_at: timestamp,
    };

    state.categories[existingIndex] = updated;
    appendEvent(state, {
      actor: input.actor,
      type: 'taxonomy.update',
      target_type: 'category',
      target_id: updated.id,
      summary: `更新分类 ${updated.name}`,
    });

    saveState(state);
    return updated;
  }

  const ids = new Set(state.categories.map((item) => item.id));
  const slug = createSlug(name);
  const baseId = slug ? `cat-${slug}` : createId('cat');
  const id = ensureUniqueId(ids, baseId);

  const created: AdminCategory = {
    id,
    name,
    description: input.description?.trim() ?? '',
    parent_id: input.parent_id ?? null,
    status: 'active',
    usage_count: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };

  state.categories.unshift(created);
  appendEvent(state, {
    actor: input.actor,
    type: 'taxonomy.create',
    target_type: 'category',
    target_id: created.id,
    summary: `新增分类 ${created.name}`,
  });

  saveState(state);
  return created;
}

export async function setCategoryStatus(id: string, status: AdminTaxonomyStatus, actor = DEFAULT_ACTOR): Promise<void> {
  const state = cloneState(loadState());
  const index = state.categories.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error(`Category not found: ${id}`);
  }

  const current = state.categories[index];
  if (current.status === status) {
    return;
  }

  state.categories[index] = {
    ...current,
    status,
    updated_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'taxonomy.toggle',
    target_type: 'category',
    target_id: id,
    summary: `${status === 'active' ? '启用' : '停用'}分类 ${current.name}`,
    payload: {
      from_status: current.status,
      to_status: status,
    },
  });

  saveState(state);
}

export async function listTags(params: ListAdminTaxonomiesParams = {}): Promise<AdminTag[]> {
  const state = loadState();

  const filtered = filterTaxonomyByQuery(state.tags, params.q ?? '')
    .filter((item) => (params.status && params.status !== 'all' ? item.status === params.status : true));

  return byUpdatedAtDesc(filtered);
}

export async function upsertTag(input: { id?: string; name: string; actor?: string }): Promise<AdminTag> {
  const state = cloneState(loadState());
  const name = input.name.trim();
  if (!name) {
    throw new Error('标签名称不能为空');
  }

  const existingIndex = input.id ? state.tags.findIndex((item) => item.id === input.id) : -1;
  const timestamp = nowIso();

  if (existingIndex >= 0) {
    const current = state.tags[existingIndex];
    const updated: AdminTag = {
      ...current,
      name,
      updated_at: timestamp,
    };

    state.tags[existingIndex] = updated;
    appendEvent(state, {
      actor: input.actor,
      type: 'taxonomy.update',
      target_type: 'tag',
      target_id: updated.id,
      summary: `更新标签 ${updated.name}`,
    });

    saveState(state);
    return updated;
  }

  const ids = new Set(state.tags.map((item) => item.id));
  const slug = createSlug(name);
  const baseId = slug ? `tag-${slug}` : createId('tag');
  const id = ensureUniqueId(ids, baseId);

  const created: AdminTag = {
    id,
    name,
    status: 'active',
    usage_count: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };

  state.tags.unshift(created);
  appendEvent(state, {
    actor: input.actor,
    type: 'taxonomy.create',
    target_type: 'tag',
    target_id: created.id,
    summary: `新增标签 ${created.name}`,
  });

  saveState(state);
  return created;
}

export async function setTagStatus(id: string, status: AdminTaxonomyStatus, actor = DEFAULT_ACTOR): Promise<void> {
  const state = cloneState(loadState());
  const index = state.tags.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error(`Tag not found: ${id}`);
  }

  const current = state.tags[index];
  if (current.status === status) {
    return;
  }

  state.tags[index] = {
    ...current,
    status,
    updated_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'taxonomy.toggle',
    target_type: 'tag',
    target_id: id,
    summary: `${status === 'active' ? '启用' : '停用'}标签 ${current.name}`,
    payload: {
      from_status: current.status,
      to_status: status,
    },
  });

  saveState(state);
}

export async function listUsers(
  params: ListAdminUsersParams = {},
): Promise<{ items: AdminUser[]; meta: AdminPaginationMeta }> {
  const state = loadState();
  const keyword = params.q?.trim().toLowerCase() ?? '';

  const filtered = state.users
    .filter((item) => {
      if (params.status && params.status !== 'all' && item.status !== params.status) {
        return false;
      }

      if (params.role_id && params.role_id !== 'all' && !item.role_ids.includes(params.role_id)) {
        return false;
      }

      if (keyword) {
        const haystack = `${item.id} ${item.nickname} ${item.email}`.toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => b.last_active_at.localeCompare(a.last_active_at));

  const meta = toSafePagination(params.offset, params.limit);
  return {
    items: filtered.slice(meta.offset, meta.offset + meta.limit),
    meta: {
      ...meta,
      total: filtered.length,
    },
  };
}

export async function listAllUsers(): Promise<AdminUser[]> {
  const state = loadState();
  return [...state.users].sort((a, b) => b.last_active_at.localeCompare(a.last_active_at));
}

export async function getUserById(userId: string): Promise<AdminUser | null> {
  const state = loadState();
  return state.users.find((item) => item.id === userId) ?? null;
}

export async function setUserStatus(
  userId: string,
  status: AdminUserStatus,
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const index = state.users.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new Error(`User not found: ${userId}`);
  }

  const current = state.users[index];
  if (current.status === status) {
    return;
  }

  state.users[index] = {
    ...current,
    status,
    last_active_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'user.status',
    target_type: 'user',
    target_id: userId,
    summary: `将用户 ${current.nickname} 状态改为 ${status}`,
    payload: {
      from_status: current.status,
      to_status: status,
    },
  });

  saveState(state);
}

export async function setUserRoles(
  userId: string,
  roleIds: string[],
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const index = state.users.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new Error(`User not found: ${userId}`);
  }

  const current = state.users[index];
  const nextRoleIds = sanitizeRoleIds(roleIds, state.roles);

  state.users[index] = {
    ...current,
    role_ids: nextRoleIds,
    last_active_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'user.roles',
    target_type: 'user',
    target_id: userId,
    summary: `更新用户 ${current.nickname} 的角色集合`,
    payload: {
      from_roles: current.role_ids,
      to_roles: nextRoleIds,
    },
  });

  saveState(state);
}

export async function listRoles(params: ListAdminRolesParams = {}): Promise<AdminRole[]> {
  const state = loadState();
  const keyword = params.q?.trim().toLowerCase() ?? '';

  return byUpdatedAtDesc(
    state.roles.filter((item) => {
      if (params.status && params.status !== 'all' && item.status !== params.status) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return `${item.id} ${item.name} ${item.description}`.toLowerCase().includes(keyword);
    }),
  );
}

export async function upsertRole(input: {
  id?: string;
  name: string;
  description?: string;
  actor?: string;
}): Promise<AdminRole> {
  const state = cloneState(loadState());
  const name = input.name.trim();
  if (!name) {
    throw new Error('角色名称不能为空');
  }

  const existingIndex = input.id ? state.roles.findIndex((item) => item.id === input.id) : -1;
  const timestamp = nowIso();

  if (existingIndex >= 0) {
    const current = state.roles[existingIndex];
    const updated: AdminRole = {
      ...current,
      name,
      description: input.description?.trim() ?? current.description,
      updated_at: timestamp,
    };

    state.roles[existingIndex] = updated;
    appendEvent(state, {
      actor: input.actor,
      type: 'role.update',
      target_type: 'role',
      target_id: updated.id,
      summary: `更新角色 ${updated.name}`,
    });

    saveState(state);
    return updated;
  }

  const ids = new Set(state.roles.map((item) => item.id));
  const slug = createSlug(name);
  const baseId = slug ? `role-${slug}` : createId('role');
  const id = ensureUniqueId(ids, baseId);

  const created: AdminRole = {
    id,
    name,
    description: input.description?.trim() ?? '',
    builtin: false,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
  };

  state.roles.unshift(created);
  state.role_permissions[id] = [];

  appendEvent(state, {
    actor: input.actor,
    type: 'role.create',
    target_type: 'role',
    target_id: created.id,
    summary: `新增角色 ${created.name}`,
  });

  saveState(state);
  return created;
}

export async function setRoleStatus(
  roleId: string,
  status: AdminRoleStatus,
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const index = state.roles.findIndex((item) => item.id === roleId);
  if (index < 0) {
    throw new Error(`Role not found: ${roleId}`);
  }

  const current = state.roles[index];
  if (current.status === status) {
    return;
  }

  state.roles[index] = {
    ...current,
    status,
    updated_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'role.toggle',
    target_type: 'role',
    target_id: roleId,
    summary: `${status === 'active' ? '启用' : '停用'}角色 ${current.name}`,
    payload: {
      from_status: current.status,
      to_status: status,
    },
  });

  saveState(state);
}

export async function listPermissions(params: ListAdminPermissionsParams = {}): Promise<AdminPermission[]> {
  const state = loadState();
  const keyword = params.q?.trim().toLowerCase() ?? '';

  return byUpdatedAtDesc(
    state.permissions.filter((item) => {
      if (params.status && params.status !== 'all' && item.status !== params.status) {
        return false;
      }

      if (params.group && params.group !== 'all' && item.group !== params.group) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return `${item.id} ${item.key} ${item.name} ${item.description}`.toLowerCase().includes(keyword);
    }),
  );
}

export async function upsertPermission(input: {
  id?: string;
  key: string;
  name: string;
  group: string;
  risk: AdminPermission['risk'];
  description?: string;
  actor?: string;
}): Promise<AdminPermission> {
  const state = cloneState(loadState());
  const key = input.key.trim();
  const name = input.name.trim();
  const group = input.group.trim();

  if (!key || !name || !group) {
    throw new Error('权限 key/name/group 不能为空');
  }

  const existingIndex = input.id ? state.permissions.findIndex((item) => item.id === input.id) : -1;
  const timestamp = nowIso();

  if (existingIndex >= 0) {
    const current = state.permissions[existingIndex];
    const updated: AdminPermission = {
      ...current,
      key,
      name,
      group,
      risk: input.risk,
      description: input.description?.trim() ?? current.description,
      updated_at: timestamp,
    };

    state.permissions[existingIndex] = updated;
    appendEvent(state, {
      actor: input.actor,
      type: 'permission.update',
      target_type: 'permission',
      target_id: updated.id,
      summary: `更新权限 ${updated.name}`,
    });

    saveState(state);
    return updated;
  }

  const ids = new Set(state.permissions.map((item) => item.id));
  const slug = createSlug(key.replace(/\./g, '-'));
  const baseId = slug ? `perm-${slug}` : createId('perm');
  const id = ensureUniqueId(ids, baseId);

  const created: AdminPermission = {
    id,
    key,
    name,
    group,
    risk: input.risk,
    description: input.description?.trim() ?? '',
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
  };

  state.permissions.unshift(created);

  appendEvent(state, {
    actor: input.actor,
    type: 'permission.create',
    target_type: 'permission',
    target_id: created.id,
    summary: `新增权限 ${created.name}`,
  });

  saveState(state);
  return created;
}

export async function setPermissionStatus(
  permissionId: string,
  status: AdminPermissionStatus,
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const index = state.permissions.findIndex((item) => item.id === permissionId);
  if (index < 0) {
    throw new Error(`Permission not found: ${permissionId}`);
  }

  const current = state.permissions[index];
  if (current.status === status) {
    return;
  }

  state.permissions[index] = {
    ...current,
    status,
    updated_at: nowIso(),
  };

  appendEvent(state, {
    actor,
    type: 'permission.toggle',
    target_type: 'permission',
    target_id: permissionId,
    summary: `${status === 'active' ? '启用' : '停用'}权限 ${current.name}`,
    payload: {
      from_status: current.status,
      to_status: status,
    },
  });

  if (status === 'inactive') {
    for (const [roleId, permissionIds] of Object.entries(state.role_permissions)) {
      state.role_permissions[roleId] = permissionIds.filter((item) => item !== permissionId);
    }
  }

  saveState(state);
}

export async function getRolePermissionMatrix(params?: {
  group?: string | 'all';
  include_inactive_permissions?: boolean;
}): Promise<{
  roles: AdminRole[];
  permissions: AdminPermission[];
  matrix: Record<string, string[]>;
}> {
  const state = loadState();

  const permissions = state.permissions.filter((item) => {
    if (!params?.include_inactive_permissions && item.status !== 'active') {
      return false;
    }

    if (params?.group && params.group !== 'all' && item.group !== params.group) {
      return false;
    }

    return true;
  });

  const permissionIds = new Set(permissions.map((item) => item.id));

  const matrix = Object.fromEntries(
    state.roles.map((role) => [
      role.id,
      sanitizePermissionIds(state.role_permissions[role.id] ?? [], permissions).filter((permissionId) => permissionIds.has(permissionId)),
    ]),
  );

  return {
    roles: byUpdatedAtDesc(state.roles),
    permissions: byUpdatedAtDesc(permissions),
    matrix,
  };
}

export async function setRolePermissions(
  roleId: string,
  permissionIds: string[],
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const role = state.roles.find((item) => item.id === roleId);
  if (!role) {
    throw new Error(`Role not found: ${roleId}`);
  }

  const nextPermissionIds = sanitizePermissionIds(permissionIds, state.permissions);
  const currentPermissionIds = state.role_permissions[roleId] ?? [];

  state.role_permissions[roleId] = nextPermissionIds;

  appendEvent(state, {
    actor,
    type: 'matrix.save',
    target_type: 'matrix',
    target_id: roleId,
    summary: `保存角色 ${role.name} 的权限矩阵`,
    payload: {
      from_count: currentPermissionIds.length,
      to_count: nextPermissionIds.length,
    },
  });

  saveState(state);
}

export async function toggleRolePermission(
  roleId: string,
  permissionId: string,
  enabled: boolean,
  actor = DEFAULT_ACTOR,
): Promise<void> {
  const state = cloneState(loadState());
  const role = state.roles.find((item) => item.id === roleId);
  const permission = state.permissions.find((item) => item.id === permissionId);

  if (!role) {
    throw new Error(`Role not found: ${roleId}`);
  }
  if (!permission) {
    throw new Error(`Permission not found: ${permissionId}`);
  }

  const current = new Set(state.role_permissions[roleId] ?? []);
  const alreadyEnabled = current.has(permissionId);

  if (enabled && !alreadyEnabled) {
    current.add(permissionId);
  }

  if (!enabled && alreadyEnabled) {
    current.delete(permissionId);
  }

  state.role_permissions[roleId] = [...current];

  appendEvent(state, {
    actor,
    type: 'matrix.toggle',
    target_type: 'matrix',
    target_id: roleId,
    summary: `${enabled ? '授予' : '移除'} ${role.name} 的权限 ${permission.name}`,
    payload: {
      role_id: roleId,
      permission_id: permissionId,
      enabled,
    },
  });

  saveState(state);
}

export async function listEvents(
  params: ListAdminEventsParams = {},
): Promise<{ items: AdminEventLog[]; meta: AdminPaginationMeta }> {
  const state = loadState();
  const keyword = params.q?.trim().toLowerCase() ?? '';

  let filtered = byTimeDesc(state.events).filter((item) => {
    if (params.type && params.type !== 'all' && item.type !== params.type) {
      return false;
    }

    if (params.actor && params.actor !== 'all' && item.actor !== params.actor) {
      return false;
    }

    if (keyword) {
      const haystack = `${item.summary} ${item.target_id ?? ''} ${JSON.stringify(item.payload ?? {})}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    return true;
  });

  filtered = filterByDateRange(filtered, params.date_from, params.date_to);

  const meta = toSafePagination(params.offset, params.limit);
  return {
    items: filtered.slice(meta.offset, meta.offset + meta.limit),
    meta: {
      ...meta,
      total: filtered.length,
    },
  };
}

export async function listEventActors(): Promise<string[]> {
  const state = loadState();
  return [...new Set(state.events.map((item) => item.actor))].sort((a, b) => a.localeCompare(b));
}

export async function listPermissionGroups(): Promise<string[]> {
  const state = loadState();
  return [...new Set(state.permissions.map((item) => item.group))].sort((a, b) => a.localeCompare(b));
}
