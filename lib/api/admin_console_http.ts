import type {
  AdminCategory,
  AdminEventLog,
  AdminPaginationMeta,
  AdminTag,
  AdminTaxonomyStatus,
  ListAdminEventsParams,
  ListAdminTaxonomiesParams,
} from '@/types/admin';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');

interface HttpErrorPayload {
  detail?: string;
}

function withSearch(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as HttpErrorPayload;
      if (payload?.detail) {
        message = payload.detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(`HTTP API error: ${message}`);
  }

  return (await response.json()) as T;
}

export async function listCategories(params: ListAdminTaxonomiesParams = {}): Promise<AdminCategory[]> {
  const response = await apiFetch<{ items: AdminCategory[] }>(
    withSearch('/admin/console/categories', {
      q: params.q,
      status: params.status,
    }),
  );

  return Array.isArray(response.items) ? response.items : [];
}

export async function upsertCategory(input: {
  id?: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  actor?: string;
}): Promise<AdminCategory> {
  return apiFetch<AdminCategory>('/admin/console/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function setCategoryStatus(id: string, status: AdminTaxonomyStatus, actor = 'admin-local'): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/admin/console/categories/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, actor }),
  });
}

export async function listTags(params: ListAdminTaxonomiesParams = {}): Promise<AdminTag[]> {
  const response = await apiFetch<{ items: AdminTag[] }>(
    withSearch('/admin/console/tags', {
      q: params.q,
      status: params.status,
    }),
  );

  return Array.isArray(response.items) ? response.items : [];
}

export async function upsertTag(input: { id?: string; name: string; actor?: string }): Promise<AdminTag> {
  return apiFetch<AdminTag>('/admin/console/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function setTagStatus(id: string, status: AdminTaxonomyStatus, actor = 'admin-local'): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/admin/console/tags/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, actor }),
  });
}

export async function listEvents(
  params: ListAdminEventsParams = {},
): Promise<{ items: AdminEventLog[]; meta: AdminPaginationMeta }> {
  const response = await apiFetch<{ items: AdminEventLog[]; meta: AdminPaginationMeta }>(
    withSearch('/admin/console/events', {
      q: params.q,
      type: params.type,
      actor: params.actor,
      date_from: params.date_from,
      date_to: params.date_to,
      offset: params.offset,
      limit: params.limit,
    }),
  );

  return {
    items: Array.isArray(response.items) ? response.items : [],
    meta: response.meta,
  };
}

export async function listEventActors(): Promise<string[]> {
  const response = await apiFetch<{ items: string[] }>('/admin/console/event-actors');
  return Array.isArray(response.items) ? response.items : [];
}
