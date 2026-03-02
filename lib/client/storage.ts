import type { SocialState } from '@/types/social';

const STORAGE_KEY = 'ai-resource-social-state-v1';

const EMPTY_STATE: SocialState = {
  favorites: {},
  votes: {},
  comments: {},
};

export function loadSocialState(): SocialState {
  if (typeof window === 'undefined') {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SocialState>;
    return {
      favorites: parsed.favorites ?? {},
      votes: parsed.votes ?? {},
      comments: parsed.comments ?? {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveSocialState(state: SocialState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
