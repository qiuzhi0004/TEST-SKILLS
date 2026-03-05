import taxonomiesRaw from '@/data/taxonomies.json';
import { loadAdminConsoleState, saveAdminConsoleState } from '@/lib/client/storage_admin';
import type {
  AdminCategory,
  AdminConsoleState,
  AdminEventLog,
  AdminEventType,
  AdminTag,
  AdminTaxonomyStatus,
  ListAdminEventsParams,
  ListAdminTaxonomiesParams,
  AdminPaginationMeta,
} from '@/types/admin';

const taxonomies = taxonomiesRaw as {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

const DEFAULT_ACTOR = 'admin-local';

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
    events: [],
  };

  appendEvent(state, {
    type: 'system.seed',
    target_type: 'system',
    summary: '初始化后台管理本地数据集。',
    payload: {
      categories: state.categories.length,
      tags: state.tags.length,
    },
  });

  return state;
}

function isSeeded(state: AdminConsoleState): boolean {
  return state.categories.length > 0 && state.tags.length > 0;
}

function loadState(): AdminConsoleState {
  const existing = loadAdminConsoleState();

  if (isSeeded(existing)) {
    return existing;
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

export async function listCategories(params: ListAdminTaxonomiesParams = {}): Promise<AdminCategory[]> {
  const state = loadState();

  const filtered = filterTaxonomyByQuery(state.categories, params.q ?? '').filter((item) => {
    return params.status && params.status !== 'all' ? item.status === params.status : true;
  });

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

  const filtered = filterTaxonomyByQuery(state.tags, params.q ?? '').filter((item) => {
    return params.status && params.status !== 'all' ? item.status === params.status : true;
  });

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
