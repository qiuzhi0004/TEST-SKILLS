'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
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
      <Button
        disabled={loading}
        size="sm"
        onClick={() => run(async () => {
          if (!window.confirm('确认通过该内容？')) return;
          await approve(type, id);
        })}
      >
        通过
      </Button>
      <Button
        disabled={loading}
        size="sm"
        onClick={() => run(async () => {
          if (!window.confirm('确认通过并上架？')) return;
          await approve(type, id, { also_list: true });
        })}
      >
        通过并上架
      </Button>
      <Button
        disabled={loading}
        size="sm"
        variant="danger"
        onClick={() => run(async () => {
          const reason = askReason('驳回');
          if (!reason) return;
          await reject(type, id, { reason });
        })}
      >
        驳回
      </Button>
      <Button
        disabled={loading}
        size="sm"
        onClick={() => run(async () => {
          if (!window.confirm('确认上架？')) return;
          await setListed(type, id);
        })}
      >
        上架
      </Button>
      <Button
        disabled={loading}
        size="sm"
        variant="danger"
        onClick={() => run(async () => {
          const reason = askReason('下架');
          if (!reason) return;
          await setUnlisted(type, id, { reason });
        })}
      >
        下架
      </Button>
      <Button
        disabled={loading}
        size="sm"
        variant="danger"
        onClick={() => run(async () => {
          const reason = askReason('回滚');
          if (!reason) return;
          await rollback(type, id, { reason });
        })}
      >
        回滚
      </Button>
      <span className="text-xs text-slate-500">当前状态：{status}</span>
    </div>
  );
}
