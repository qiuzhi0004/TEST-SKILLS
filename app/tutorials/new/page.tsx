// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { TutorialAuthoringPage } from "@/components/forms/authoring/TutorialAuthoringPage";

export default function TutorialCreatePage() {
  return <TutorialAuthoringPage mode="new" />;
}
