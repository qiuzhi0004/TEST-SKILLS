import type { AuthResultVM, AuthSession } from "@/types/auth";

const AUTH_SESSION_KEY = "luzi_auth_session_v1";
export const AUTH_SESSION_CHANGE_EVENT = "luzi-auth-session-change";

let hasSnapshotCache = false;
let cachedSnapshotRaw: string | null = null;
let cachedSnapshotValue: AuthSession | null = null;

function emitAuthChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const parsed = value as Partial<AuthSession>;
  return Boolean(
    typeof parsed.token === "string" &&
      parsed.token &&
      parsed.user &&
      typeof parsed.user.id === "string" &&
      typeof parsed.user.phone === "string" &&
      typeof parsed.user.nickname === "string" &&
      typeof parsed.logged_in_at === "string",
  );
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (hasSnapshotCache && raw === cachedSnapshotRaw) {
    return cachedSnapshotValue;
  }

  if (!raw) {
    cachedSnapshotRaw = raw;
    cachedSnapshotValue = null;
    hasSnapshotCache = true;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const value = isValidSession(parsed) ? parsed : null;
    cachedSnapshotRaw = raw;
    cachedSnapshotValue = value;
    hasSnapshotCache = true;
    return value;
  } catch {
    cachedSnapshotRaw = raw;
    cachedSnapshotValue = null;
    hasSnapshotCache = true;
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }
  const raw = JSON.stringify(session);
  window.localStorage.setItem(AUTH_SESSION_KEY, raw);
  cachedSnapshotRaw = raw;
  cachedSnapshotValue = session;
  hasSnapshotCache = true;
  emitAuthChange();
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  cachedSnapshotRaw = null;
  cachedSnapshotValue = null;
  hasSnapshotCache = true;
  emitAuthChange();
}

export function subscribeAuthSession(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== AUTH_SESSION_KEY) {
      return;
    }
    onStoreChange();
  };
  const handleAuthChange = () => onStoreChange();
  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, handleAuthChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, handleAuthChange);
  };
}

export function buildAuthSession(payload: AuthResultVM): AuthSession {
  return {
    token: payload.token,
    user: payload.user,
    logged_in_at: new Date().toISOString(),
  };
}
