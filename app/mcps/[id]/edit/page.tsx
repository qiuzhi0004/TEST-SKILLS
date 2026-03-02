// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { McpAuthoringPage } from '@/components/forms/authoring/McpAuthoringPage';

interface McpEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function McpEditPage({ params }: McpEditPageProps) {
  const { id } = await params;
  return <McpAuthoringPage mode="edit" id={id} />;
}
