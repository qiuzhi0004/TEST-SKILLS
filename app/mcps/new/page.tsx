// NOTE: 当前阶段不做守卫（见 /docs/DECISIONS.md）。
import { McpAuthoringPage } from "@/components/forms/authoring/McpAuthoringPage";

export default function McpCreatePage() {
  return <McpAuthoringPage mode="new" />;
}
