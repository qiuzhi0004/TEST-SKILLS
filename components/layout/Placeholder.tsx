interface PlaceholderProps {
  title?: string;
  description?: string;
  todos?: string[];
}

export function Placeholder({
  title = "功能占位",
  description = "该区块在后续步骤实现具体交互与业务逻辑。",
  todos = [],
}: PlaceholderProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-500" aria-hidden>
          ◻
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
          {todos.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              {todos.map((todo) => (
                <li key={todo}>{todo}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
