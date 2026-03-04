import type { AdminConsoleState } from '@/types/admin';

const KEY = 'luzi_admin_console_v1';

const EMPTY_STATE: AdminConsoleState = {
  categories: [],
  tags: [],
  users: [],
  roles: [],
  permissions: [],
  role_permissions: {},
  events: [],
};

function cloneEmptyState(): AdminConsoleState {
  return {
    categories: [],
    tags: [],
    users: [],
    roles: [],
    permissions: [],
    role_permissions: {},
    events: [],
  };
}

function normalizeState(parsed: Partial<AdminConsoleState>): AdminConsoleState {
  const rolePermissions = parsed.role_permissions && typeof parsed.role_permissions === 'object'
    ? Object.fromEntries(
        Object.entries(parsed.role_permissions).map(([roleId, permissionIds]) => [
          roleId,
          Array.isArray(permissionIds) ? permissionIds.filter((item): item is string => typeof item === 'string') : [],
        ]),
      )
    : {};

  return {
    categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    users: Array.isArray(parsed.users) ? parsed.users : [],
    roles: Array.isArray(parsed.roles) ? parsed.roles : [],
    permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    role_permissions: rolePermissions,
    events: Array.isArray(parsed.events) ? parsed.events : [],
  };
}

export function loadAdminConsoleState(): AdminConsoleState {
  if (typeof window === 'undefined') {
    return cloneEmptyState();
  }

  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return cloneEmptyState();
  }

  try {
    return normalizeState(JSON.parse(raw) as Partial<AdminConsoleState>);
  } catch {
    return cloneEmptyState();
  }
}

export function saveAdminConsoleState(state: AdminConsoleState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAdminConsoleState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(KEY);
}

export { EMPTY_STATE as EMPTY_ADMIN_STATE };
