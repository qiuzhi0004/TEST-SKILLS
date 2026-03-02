import { Skeleton } from '@/components/feedback/Skeleton';

export default function DetailLoading() {
  return (
    <div className="space-y-4" aria-label="详情页加载中">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
