import type {
  AuthApiError,
  AuthPurpose,
  AuthResultVM,
  LoginWithPhoneCodeFn,
  RegisterWithPhoneCodeFn,
  SendCodeResult,
  SendPhoneCodeFn,
} from "@/types/auth";

const MOCK_CODE = "123456";
const PHONE_PATTERN = /^1\d{10}$/;
const USERS_KEY = "luzi_auth_users_v1";

interface LocalUserRecord {
  id: string;
  phone: string;
  nickname: string;
  created_at: string;
}

function toApiError(message: string, status?: number, code?: string): AuthApiError {
  const error = new Error(message) as AuthApiError;
  error.status = status;
  error.code = code;
  return error;
}

function ensurePhone(phone: string): string {
  const value = phone.trim();
  if (!PHONE_PATTERN.test(value)) {
    throw toApiError("请输入 11 位手机号", 400, "INVALID_PHONE");
  }
  return value;
}

function ensureCode(code: string): void {
  if (code.trim() !== MOCK_CODE) {
    throw toApiError("验证码错误，请输入 123456", 400, "INVALID_CODE");
  }
}

function loadLocalUsers(): LocalUserRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as LocalUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUserRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function makeToken(): string {
  return `local_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export const sendPhoneCode: SendPhoneCodeFn = async (phone: string, purpose: AuthPurpose): Promise<SendCodeResult> => {
  const value = ensurePhone(phone);
  if (purpose !== "login" && purpose !== "register") {
    throw toApiError("purpose must be login/register", 400, "INVALID_PURPOSE");
  }
  return {
    ok: true,
    phone: value,
    purpose,
    mock_code: MOCK_CODE,
    expires_in_seconds: 300,
  };
};

export const loginWithPhoneCode: LoginWithPhoneCodeFn = async (phone: string, code: string): Promise<AuthResultVM> => {
  const value = ensurePhone(phone);
  ensureCode(code);

  const users = loadLocalUsers();
  const user = users.find((item) => item.phone === value);
  if (!user) {
    throw toApiError("手机号未注册，请先注册", 404, "PHONE_NOT_REGISTERED");
  }

  return {
    token: makeToken(),
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
    },
  };
};

export const registerWithPhoneCode: RegisterWithPhoneCodeFn = async (
  nickname: string,
  phone: string,
  code: string,
): Promise<AuthResultVM> => {
  const normalizedNickname = nickname.trim();
  if (!normalizedNickname) {
    throw toApiError("请输入昵称", 400, "INVALID_NICKNAME");
  }
  const value = ensurePhone(phone);
  ensureCode(code);

  const users = loadLocalUsers();
  if (users.some((item) => item.phone === value)) {
    throw toApiError("手机号已注册，请直接登录", 409, "PHONE_ALREADY_REGISTERED");
  }

  const record: LocalUserRecord = {
    id: `local-user-${Date.now()}`,
    phone: value,
    nickname: normalizedNickname,
    created_at: new Date().toISOString(),
  };
  users.unshift(record);
  saveLocalUsers(users);

  return {
    token: makeToken(),
    user: {
      id: record.id,
      phone: record.phone,
      nickname: record.nickname,
    },
  };
};
