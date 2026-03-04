const KEY = 'luzi_auth_v1';
const AUTH_CHANGED_EVENT = 'luzi:auth-changed';

export interface AuthSession {
  nickname: string;
}

function read(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function write(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(KEY);
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAuthSession(): AuthSession | null {
  return read();
}

export function login(nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) {
    throw new Error('nickname is required');
  }
  write({ nickname: trimmed });
}

export function logout() {
  write(null);
}

export function onAuthChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) handler();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(AUTH_CHANGED_EVENT, handler);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  };
}
