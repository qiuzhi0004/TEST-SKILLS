import { Skeleton } from '@/components/feedback/Skeleton';

export default function SegmentLoading() {
  return (
    <div className="space-y-4" aria-label="分区加载中">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
