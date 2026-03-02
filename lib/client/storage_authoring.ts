import type { AuthoringState } from '@/types/authoring';

const KEY = 'luzi_authoring_v1';

const EMPTY_STATE: AuthoringState = {
  records: [],
};

export function loadAuthoringState(): AuthoringState {
  if (typeof window === 'undefined') {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthoringState>;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveAuthoringState(state: AuthoringState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(state));
}
