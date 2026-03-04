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

export type AdminUserStatus = 'active' | 'invited' | 'suspended';

export interface AdminUser {
  id: string;
  nickname: string;
  email: string;
  status: AdminUserStatus;
  role_ids: string[];
  created_at: string;
  last_active_at: string;
  notes?: string;
}

export type AdminRoleStatus = 'active' | 'inactive';

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  builtin: boolean;
  status: AdminRoleStatus;
  created_at: string;
  updated_at: string;
}

export type AdminPermissionRisk = 'low' | 'medium' | 'high';
export type AdminPermissionStatus = 'active' | 'inactive';

export interface AdminPermission {
  id: string;
  key: string;
  name: string;
  group: string;
  risk: AdminPermissionRisk;
  description: string;
  status: AdminPermissionStatus;
  created_at: string;
  updated_at: string;
}

export type AdminEventTarget = 'category' | 'tag' | 'user' | 'role' | 'permission' | 'matrix' | 'system';

export type AdminEventType =
  | 'taxonomy.create'
  | 'taxonomy.update'
  | 'taxonomy.toggle'
  | 'user.status'
  | 'user.roles'
  | 'role.create'
  | 'role.update'
  | 'role.toggle'
  | 'permission.create'
  | 'permission.update'
  | 'permission.toggle'
  | 'matrix.save'
  | 'matrix.toggle'
  | 'system.seed';

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
  users: AdminUser[];
  roles: AdminRole[];
  permissions: AdminPermission[];
  role_permissions: Record<string, string[]>;
  events: AdminEventLog[];
}

export interface ListAdminTaxonomiesParams {
  q?: string;
  status?: AdminTaxonomyStatus | 'all';
}

export interface ListAdminUsersParams {
  q?: string;
  status?: AdminUserStatus | 'all';
  role_id?: string | 'all';
  offset?: number;
  limit?: number;
}

export interface ListAdminRolesParams {
  q?: string;
  status?: AdminRoleStatus | 'all';
}

export interface ListAdminPermissionsParams {
  q?: string;
  group?: string | 'all';
  status?: AdminPermissionStatus | 'all';
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
