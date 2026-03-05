export type AuthPurpose = "login" | "register";

export interface AuthUserVM {
  id: string;
  phone: string;
  nickname: string;
}

export interface AuthResultVM {
  token: string;
  user: AuthUserVM;
}

export interface AuthSession {
  token: string;
  user: AuthUserVM;
  logged_in_at: string;
}

export interface SendCodeResult {
  ok: boolean;
  phone: string;
  purpose: AuthPurpose;
  mock_code: string;
  expires_in_seconds: number;
}

export interface AuthApiError extends Error {
  code?: string;
  status?: number;
}

export type SendPhoneCodeFn = (phone: string, purpose: AuthPurpose) => Promise<SendCodeResult>;
export type LoginWithPhoneCodeFn = (phone: string, code: string) => Promise<AuthResultVM>;
export type RegisterWithPhoneCodeFn = (nickname: string, phone: string, code: string) => Promise<AuthResultVM>;
