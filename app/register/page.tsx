"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { InlineNotice } from "@/components/feedback/InlineNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerWithPhoneCode, sendPhoneCode } from "@/lib/api/auth";
import { buildAuthSession, saveAuthSession } from "@/lib/client/auth";
import type { AuthApiError } from "@/types/auth";

const DEFAULT_NEXT = "/me/favorites";
const PHONE_PATTERN = /^1\d{10}$/;

function resolveNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return DEFAULT_NEXT;
  }
  return rawNext.startsWith("/") ? rawNext : DEFAULT_NEXT;
}

function validatePhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim());
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loginHref = `/login?phone=${encodeURIComponent(phone.trim())}&next=${encodeURIComponent(nextPath)}`;

  async function handleSendCode() {
    setNotice("");
    setErrorText("");
    setErrorCode("");

    if (!validatePhone(phone)) {
      setErrorText("请输入 11 位手机号。");
      return;
    }

    setSending(true);
    try {
      await sendPhoneCode(phone.trim(), "register");
      setNotice("验证码已发送（测试环境固定为 123456）。");
    } catch (error) {
      const authError = error as AuthApiError;
      setErrorText(authError.message || "验证码发送失败，请稍后重试。");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setErrorText("");
    setErrorCode("");

    if (!nickname.trim()) {
      setErrorText("请输入昵称。");
      return;
    }
    if (!validatePhone(phone)) {
      setErrorText("请输入 11 位手机号。");
      return;
    }
    if (!code.trim()) {
      setErrorText("请输入验证码。");
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerWithPhoneCode(nickname.trim(), phone.trim(), code.trim());
      saveAuthSession(buildAuthSession(result));
      router.replace(nextPath);
    } catch (error) {
      const authError = error as AuthApiError;
      setErrorCode(authError.code ?? "");
      setErrorText(authError.message || "注册失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Phone Register</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">手机号注册</h1>
        <p className="mt-2 text-sm text-slate-600">请输入昵称、手机号和验证码完成注册。验证码测试值固定为 123456。</p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="nickname" className="text-sm font-medium text-slate-700">
              昵称
            </label>
            <Input
              id="nickname"
              placeholder="请输入昵称"
              maxLength={50}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-slate-700">
              手机号
            </label>
            <Input
              id="phone"
              placeholder="请输入 11 位手机号"
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D+/g, ""))}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="code" className="text-sm font-medium text-slate-700">
              验证码
            </label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="请输入验证码"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D+/g, ""))}
              />
              <Button type="button" variant="secondary" onClick={handleSendCode} disabled={sending}>
                {sending ? "发送中..." : "获取验证码"}
              </Button>
            </div>
          </div>

          {notice ? <InlineNotice title={notice} tone="success" /> : null}

          {errorText ? (
            <InlineNotice
              title={errorText}
              tone="danger"
              actionSlot={
                errorCode === "PHONE_ALREADY_REGISTERED" ? (
                  <Link href={loginHref} className="text-xs underline">
                    手机号已注册，去登录
                  </Link>
                ) : null
              }
            />
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "注册中..." : "注册"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          已有账号？{" "}
          <Link href={loginHref} className="font-medium text-sky-700 underline">
            去登录
          </Link>
        </p>
      </section>
    </div>
  );
}
