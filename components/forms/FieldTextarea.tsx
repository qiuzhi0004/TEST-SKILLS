interface FieldTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

export function FieldTextarea({ label, value, onChange, rows = 4, placeholder, required }: FieldTextareaProps) {
  return (
    <label className="grid gap-1 text-sm text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
      />
    </label>
  );
}
