'use client';

import { useState } from 'react';
import { approve, reject, rollback, setListed, setUnlisted } from '@/lib/api/admin_review';
import type { ContentStatus, ContentType } from '@/types/content';

interface ReviewActionsProps {
  type: ContentType;
  id: string;
  status: ContentStatus;
  onDone?: () => void;
}

export function ReviewActions({ type, id, status, onDone }: ReviewActionsProps) {
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
      onDone?.();
    } finally {
      setLoading(false);
    }
  };

  const askReason = (label: string) => {
    const value = window.prompt(`${label} 原因（必填）`, '');
    return (value ?? '').trim();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          if (!window.confirm('确认通过该内容？')) return;
          await approve(type, id);
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        通过
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          if (!window.confirm('确认通过并上架？')) return;
          await approve(type, id, { also_list: true });
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        通过并上架
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          const reason = askReason('驳回');
          if (!reason) return;
          await reject(type, id, { reason });
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        驳回
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          if (!window.confirm('确认上架？')) return;
          await setListed(type, id);
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        上架
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          const reason = askReason('下架');
          if (!reason) return;
          await setUnlisted(type, id, { reason });
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        下架
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => run(async () => {
          const reason = askReason('回滚');
          if (!reason) return;
          await rollback(type, id, { reason });
        })}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      >
        回滚
      </button>
      <span className="text-xs text-slate-500">当前状态：{status}</span>
    </div>
  );
}
