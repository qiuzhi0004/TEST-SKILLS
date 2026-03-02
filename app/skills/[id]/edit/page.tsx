// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { SkillAuthoringPage } from '@/components/forms/authoring/SkillAuthoringPage';

interface SkillEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function SkillEditPage({ params }: SkillEditPageProps) {
  const { id } = await params;
  return <SkillAuthoringPage mode="edit" id={id} />;
}
