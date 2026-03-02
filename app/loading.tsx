import { Skeleton } from '@/components/feedback/Skeleton';

export default function RootLoading() {
  return (
    <div className="space-y-4" aria-label="页面加载中">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
