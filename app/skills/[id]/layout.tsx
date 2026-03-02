import type { Metadata } from 'next';
import { getSkill } from '@/lib/api';
import { buildMetadata } from '@/components/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getSkill(id);
    return buildMetadata({
      title: `${detail.content.title} | Skill`,
      description: detail.content.one_liner ?? 'Skill 详情页',
      path: `/skills/${id}`,
    });
  } catch {
    return buildMetadata({ title: `Skill ${id}`, description: 'Skill 详情页', path: `/skills/${id}` });
  }
}

export default function SkillDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
