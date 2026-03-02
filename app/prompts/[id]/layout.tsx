import type { Metadata } from 'next';
import { getPrompt } from '@/lib/api';
import { buildMetadata } from '@/components/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getPrompt(id);
    return buildMetadata({
      title: `${detail.content.title} | Prompt`,
      description: detail.content.one_liner ?? 'Prompt 详情页',
      path: `/prompts/${id}`,
    });
  } catch {
    return buildMetadata({ title: `Prompt ${id}`, description: 'Prompt 详情页', path: `/prompts/${id}` });
  }
}

export default function PromptDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
