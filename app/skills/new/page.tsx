// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { SkillAuthoringPage } from "@/components/forms/authoring/SkillAuthoringPage";

export default function SkillCreatePage() {
  return <SkillAuthoringPage mode="new" />;
}
