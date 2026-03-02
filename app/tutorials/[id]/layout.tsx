import type { Metadata } from 'next';
import { getTutorial } from '@/lib/api';
import { buildMetadata } from '@/components/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getTutorial(id);
    return buildMetadata({
      title: `${detail.content.title} | 教程`,
      description: detail.content.one_liner ?? '教程详情页',
      path: `/tutorials/${id}`,
    });
  } catch {
    return buildMetadata({ title: `教程 ${id}`, description: '教程详情页', path: `/tutorials/${id}` });
  }
}

export default function TutorialDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
