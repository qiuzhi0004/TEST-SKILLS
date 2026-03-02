import Link from 'next/link';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function RootNotFound() {
  return (
    <EmptyState
      title="页面不存在"
      description="你访问的地址不存在或已被移动。"
      actionSlot={<Link href="/" className="text-sm text-sky-700 underline">返回首页</Link>}
    />
  );
}
