import { listContents } from "@/lib/api";

export default async function HomePage() {
  const { items, meta } = await listContents({ type: "all", offset: 0, limit: 6 });
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Home 占位</h1>
        <p className="mt-2 text-sm text-slate-600">
          当前仅完成第1步基础工程：项目骨架、类型契约、Mock API 与全站 layout shell。
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Mock API 预览（前 6 条）</h2>
        <p className="mt-1 text-xs text-slate-500">total: {meta.total}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item.id} className="rounded border border-slate-200 px-3 py-2">
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-xs uppercase text-slate-500">{item.type}</span>
              <span className="ml-2 text-xs text-slate-500">{item.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
