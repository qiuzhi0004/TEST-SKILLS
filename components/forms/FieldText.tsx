interface FieldTextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function FieldText({ label, value, onChange, placeholder, required }: FieldTextProps) {
  return (
    <label className="grid gap-1 text-sm text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-300 bg-white px-3 py-2"
      />
    </label>
  );
}
