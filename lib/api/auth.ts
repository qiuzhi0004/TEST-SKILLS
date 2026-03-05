import * as httpApi from "@/lib/api/auth_http";
import * as localApi from "@/lib/api/auth_local";
import type { LoginWithPhoneCodeFn, RegisterWithPhoneCodeFn, SendPhoneCodeFn } from "@/types/auth";

const USE_HTTP = process.env.NEXT_PUBLIC_API_MODE === "http";
const activeApi = USE_HTTP ? httpApi : localApi;

export const sendPhoneCode: SendPhoneCodeFn = activeApi.sendPhoneCode;
export const loginWithPhoneCode: LoginWithPhoneCodeFn = activeApi.loginWithPhoneCode;
export const registerWithPhoneCode: RegisterWithPhoneCodeFn = activeApi.registerWithPhoneCode;
