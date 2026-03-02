'use client';

import { useEffect, useState } from 'react';
import { listAuditLogs } from '@/lib/api/audit';
import type { ContentStatus, ContentType } from '@/types/content';

interface StatusBannerProps {
  type: ContentType;
  id: string;
  status: ContentStatus;
}

export function StatusBanner({ type, id, status }: StatusBannerProps) {
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (status !== 'Reject') return;

    let cancelled = false;
    void listAuditLogs({ target_type: type, target_id: id, limit: 20, offset: 0 }).then((res) => {
      if (cancelled) return;
      const latestReject = res.items.find((item) => item.action === 'reject');
      setReason(latestReject?.reason ?? '暂无原因');
    });

    return () => {
      cancelled = true;
    };
  }, [id, status, type]);

  if (status === 'Listed') {
    return null;
  }

  let text = `当前状态：${status}`;
  if (status === 'PendingReview') {
    text = '当前内容待审核，尚未上架。';
  } else if (status === 'Reject') {
    text = `当前内容已驳回。原因：${reason || '暂无原因'}`;
  } else if (status === 'Unlisted') {
    text = '当前内容已下架（Unlisted）。';
  } else if (status === 'Draft') {
    text = '当前内容为草稿（Draft），仅本地工作区可见。';
  }

  return (
    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {text}
    </div>
  );
}
