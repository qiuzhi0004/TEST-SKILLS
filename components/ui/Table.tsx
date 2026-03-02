import type { ReactNode } from 'react';

interface TableProps {
  head: ReactNode;
  body: ReactNode;
}

export function Table({ head, body }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full border-collapse text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{head}</thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}
