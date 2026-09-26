import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.160.9";
export const parentRuleId = "E-0.1.160";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    if (!["operations", "gitops", "handoff"].every((term) => text.includes(term)))
      return fail(
        ruleId,
        "GHCR publication must document separate Operations and GitOps handoffs.",
      );
  } catch {
    return fail(ruleId, "AGENTS.md is required for GHCR handoff boundaries.");
  }
  return pass(ruleId);
}
