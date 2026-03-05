import * as httpApi from '@/lib/api/admin_console_http';
import * as localApi from '@/lib/api/admin_console_local';
import type {
  AdminCategory,
  AdminEventLog,
  AdminPaginationMeta,
  AdminTag,
  AdminTaxonomyStatus,
  ListAdminEventsParams,
  ListAdminTaxonomiesParams,
} from '@/types/admin';

const USE_HTTP = process.env.NEXT_PUBLIC_API_MODE === 'http';

function logFallback(action: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Keep fallback transparent in dev while avoiding noisy hard failures.
  console.warn(`[admin_console] ${action} HTTP failed, fallback to local storage`, error);
}

async function withFallback<T>(action: string, httpCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> {
  if (!USE_HTTP) {
    return localCall();
  }

  try {
    return await httpCall();
  } catch (error) {
    logFallback(action, error);
    return localCall();
  }
}

export async function listCategories(params: ListAdminTaxonomiesParams = {}): Promise<AdminCategory[]> {
  return withFallback('listCategories', () => httpApi.listCategories(params), () => localApi.listCategories(params));
}

export async function upsertCategory(input: {
  id?: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  actor?: string;
}): Promise<AdminCategory> {
  return withFallback('upsertCategory', () => httpApi.upsertCategory(input), () => localApi.upsertCategory(input));
}

export async function setCategoryStatus(id: string, status: AdminTaxonomyStatus, actor = 'admin-local'): Promise<void> {
  return withFallback(
    'setCategoryStatus',
    () => httpApi.setCategoryStatus(id, status, actor),
    () => localApi.setCategoryStatus(id, status, actor),
  );
}

export async function listTags(params: ListAdminTaxonomiesParams = {}): Promise<AdminTag[]> {
  return withFallback('listTags', () => httpApi.listTags(params), () => localApi.listTags(params));
}

export async function upsertTag(input: { id?: string; name: string; actor?: string }): Promise<AdminTag> {
  return withFallback('upsertTag', () => httpApi.upsertTag(input), () => localApi.upsertTag(input));
}

export async function setTagStatus(id: string, status: AdminTaxonomyStatus, actor = 'admin-local'): Promise<void> {
  return withFallback('setTagStatus', () => httpApi.setTagStatus(id, status, actor), () => localApi.setTagStatus(id, status, actor));
}

export async function listEvents(
  params: ListAdminEventsParams = {},
): Promise<{ items: AdminEventLog[]; meta: AdminPaginationMeta }> {
  return withFallback('listEvents', () => httpApi.listEvents(params), () => localApi.listEvents(params));
}

export async function listEventActors(): Promise<string[]> {
  return withFallback('listEventActors', () => httpApi.listEventActors(), () => localApi.listEventActors());
}
