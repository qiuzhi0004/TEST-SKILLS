// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { TutorialAuthoringPage } from '@/components/forms/authoring/TutorialAuthoringPage';

interface TutorialEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorialEditPage({ params }: TutorialEditPageProps) {
  const { id } = await params;
  return <TutorialAuthoringPage mode="edit" id={id} />;
}
