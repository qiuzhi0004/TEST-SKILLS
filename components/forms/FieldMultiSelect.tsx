import { useMemo, useState } from 'react';

interface Option {
  id: string;
  name: string;
}

interface FieldMultiSelectProps {
  label: string;
  value: string[];
  options: Option[];
  onChange: (next: string[]) => void;
  required?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function FieldMultiSelect({
  label,
  value,
  options,
  onChange,
  required,
  allowCustom = false,
  customPlaceholder = '输入自定义标签',
}: FieldMultiSelectProps) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  };

  const displayOptions = useMemo(() => {
    const base = [...options];
    const knownIds = new Set(base.map((item) => item.id));
    value.forEach((id) => {
      if (!knownIds.has(id)) {
        base.push({ id, name: id });
      }
    });
    return base;
  }, [options, value]);

  const addCustom = () => {
    const next = customInput.trim();
    if (!next) return;
    if (!value.includes(next)) {
      onChange([...value, next]);
    }
    setCustomInput('');
  };

  return (
    <div className="grid gap-1 text-sm text-slate-700">
      <p>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </p>
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-300 bg-white p-2">
        {displayOptions.map((option) => {
          const selected = value.includes(option.id);
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => toggle(option.id)}
              className={`rounded border px-2 py-1 text-xs ${selected ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-300 text-slate-600'}`}
            >
              {option.name}
            </button>
          );
        })}
      </div>
      {allowCustom ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={customInput}
            onChange={(event) => setCustomInput(event.target.value)}
            placeholder={customPlaceholder}
            className="h-9 min-w-56 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          <button
            type="button"
            onClick={addCustom}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            添加标签
          </button>
        </div>
      ) : null}
    </div>
  );
}
