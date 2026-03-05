export type AdminTaxonomyStatus = 'active' | 'inactive';

export interface AdminCategory {
  id: string;
  name: string;
  parent_id: string | null;
  description: string;
  status: AdminTaxonomyStatus;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminTag {
  id: string;
  name: string;
  status: AdminTaxonomyStatus;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type AdminEventTarget = 'category' | 'tag' | 'system';

export type AdminEventType = 'taxonomy.create' | 'taxonomy.update' | 'taxonomy.toggle' | 'system.seed';

export interface AdminEventLog {
  id: string;
  at: string;
  actor: string;
  type: AdminEventType;
  target_type: AdminEventTarget;
  target_id?: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface AdminConsoleState {
  categories: AdminCategory[];
  tags: AdminTag[];
  events: AdminEventLog[];
}

export interface ListAdminTaxonomiesParams {
  q?: string;
  status?: AdminTaxonomyStatus | 'all';
}

export interface ListAdminEventsParams {
  q?: string;
  type?: AdminEventType | 'all';
  actor?: string | 'all';
  date_from?: string;
  date_to?: string;
  offset?: number;
  limit?: number;
}

export interface AdminPaginationMeta {
  offset: number;
  limit: number;
  total: number;
}
