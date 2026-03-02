import { FieldTextarea } from '@/components/forms/FieldTextarea';

interface FieldCodeTextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FieldCodeText({ label, value, onChange, required }: FieldCodeTextProps) {
  return (
    <FieldTextarea
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      rows={6}
      placeholder="按原样文本粘贴配置"
    />
  );
}
