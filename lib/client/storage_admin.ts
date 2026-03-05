import type { AdminConsoleState } from '@/types/admin';

const KEY = 'luzi_admin_console_v1';

const EMPTY_STATE: AdminConsoleState = {
  categories: [],
  tags: [],
  events: [],
};

function cloneEmptyState(): AdminConsoleState {
  return {
    categories: [],
    tags: [],
    events: [],
  };
}

function normalizeState(parsed: Partial<AdminConsoleState>): AdminConsoleState {
  return {
    categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
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
