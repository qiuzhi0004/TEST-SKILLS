import Link from 'next/link';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function ResourceNotFound() {
  return (
    <EmptyState
      title="资源不存在"
      description="请检查链接是否正确，或返回列表页重新选择。"
      actionSlot={<Link href="/" className="text-sm text-sky-700 underline">返回首页</Link>}
    />
  );
}
