'use client';

import { useEffect, useState } from 'react';
import { listAuditLogs } from '@/lib/api/audit';
import type { AuditLogItem } from '@/types/audit';
import type { ContentType } from '@/types/content';

interface AuditLogPanelProps {
  targetType?: ContentType;
  targetId?: string;
}

export function AuditLogPanel({ targetType, targetId }: AuditLogPanelProps) {
  const [items, setItems] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listAuditLogs({ target_type: targetType, target_id: targetId, limit: 50, offset: 0 }).then((res) => {
      if (!cancelled) setItems(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">暂无审计日志</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
          <p>{item.at} · {item.action}</p>
          <p>{item.target_type}:{item.target_id}</p>
          <p>{item.from_status ?? '-'} → {item.to_status ?? '-'}</p>
          {item.reason ? <p>reason: {item.reason}</p> : null}
        </li>
      ))}
    </ul>
  );
}
