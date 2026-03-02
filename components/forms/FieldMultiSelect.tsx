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
}

export function FieldMultiSelect({ label, value, options, onChange, required }: FieldMultiSelectProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <div className="grid gap-1 text-sm text-slate-700">
      <p>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </p>
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-300 bg-white p-2">
        {options.map((option) => {
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
    </div>
  );
}
