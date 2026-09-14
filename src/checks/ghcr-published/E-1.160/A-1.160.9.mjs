import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.160.9";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
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
