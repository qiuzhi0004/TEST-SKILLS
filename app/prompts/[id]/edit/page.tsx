// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { PromptAuthoringPage } from '@/components/forms/authoring/PromptAuthoringPage';

interface PromptEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptEditPage({ params }: PromptEditPageProps) {
  const { id } = await params;
  return <PromptAuthoringPage mode="edit" id={id} />;
}
