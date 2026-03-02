// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { PromptAuthoringPage } from "@/components/forms/authoring/PromptAuthoringPage";

export default function PromptCreatePage() {
  return <PromptAuthoringPage mode="new" />;
}
