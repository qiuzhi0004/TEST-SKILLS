import type { AuditState } from '@/types/audit';

const KEY = 'luzi_audit_v1';

const EMPTY_STATE: AuditState = {
  logs: [],
};

export function loadAuditState(): AuditState {
  if (typeof window === 'undefined') {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuditState>;
    return {
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveAuditState(state: AuditState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(state));
}
