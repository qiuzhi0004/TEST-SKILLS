interface RepeatableListInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
}

export function RepeatableListInput({ label, value, onChange, required }: RepeatableListInputProps) {
  const update = (index: number, text: string) => {
    const next = [...value];
    next[index] = text;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-2 text-sm text-slate-700">
      <p>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </p>
      <div className="space-y-2 rounded-md border border-slate-300 bg-white p-2">
        {value.map((item, idx) => (
          <div key={`${idx}-${item}`} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => update(idx, e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1"
              placeholder="输入命令"
            />
            <button type="button" onClick={() => remove(idx)} className="rounded border border-slate-300 px-2 py-1 text-xs">
              删除
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, ''])}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          + 添加一条
        </button>
      </div>
    </div>
  );
}
