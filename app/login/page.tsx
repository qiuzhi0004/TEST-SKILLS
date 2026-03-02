import { Placeholder } from "@/components/layout/Placeholder";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";

export default function LoginPage() {
  return (
    <PageShell title="登录" subtitle="低保真块：手机号 + 验证码">
      <SectionCard title="登录表单">
        <div className="grid max-w-md gap-2 text-sm text-slate-600">
          <input className="rounded border border-slate-300 px-2 py-1" placeholder="手机号" disabled />
          <div className="flex gap-2">
            <input className="flex-1 rounded border border-slate-300 px-2 py-1" placeholder="验证码" disabled />
            <button className="rounded border border-slate-300 px-3 py-1" type="button">
              发送验证码
            </button>
          </div>
          <button className="rounded border border-slate-300 px-3 py-1 text-left" type="button">
            登录
          </button>
        </div>
      </SectionCard>
      <SectionCard title="说明">
        <Placeholder title="登录逻辑占位" todos={["短信发送", "会话写入", "returnTo 回跳"]} />
      </SectionCard>
    </PageShell>
  );
}
