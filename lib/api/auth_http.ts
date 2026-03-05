import type {
  AuthApiError,
  AuthPurpose,
  AuthResultVM,
  LoginWithPhoneCodeFn,
  RegisterWithPhoneCodeFn,
  SendCodeResult,
  SendPhoneCodeFn,
} from "@/types/auth";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

interface HttpErrorPayload {
  detail?: string;
  code?: string;
}

function toApiError(message: string, status?: number, code?: string): AuthApiError {
  const error = new Error(message) as AuthApiError;
  error.status = status;
  error.code = code;
  return error;
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: HttpErrorPayload | undefined;
    try {
      payload = (await response.json()) as HttpErrorPayload;
    } catch {
      payload = undefined;
    }
    const message = payload?.detail || `${response.status} ${response.statusText}`;
    throw toApiError(message, response.status, payload?.code);
  }

  return (await response.json()) as T;
}

export const sendPhoneCode: SendPhoneCodeFn = async (phone: string, purpose: AuthPurpose): Promise<SendCodeResult> =>
  authFetch<SendCodeResult>("/auth/send-code", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  });

export const loginWithPhoneCode: LoginWithPhoneCodeFn = async (
  phone: string,
  code: string,
): Promise<AuthResultVM> =>
  authFetch<AuthResultVM>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });

export const registerWithPhoneCode: RegisterWithPhoneCodeFn = async (
  nickname: string,
  phone: string,
  code: string,
): Promise<AuthResultVM> =>
  authFetch<AuthResultVM>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nickname, phone, code }),
  });
