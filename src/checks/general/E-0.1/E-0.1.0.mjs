import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { pass } from "../../check-result.mjs";
import { fail } from "../../check-result.mjs";
import { findMissingAgentsSections } from "./validate-agents-required-sections.mjs";

export const ruleId = "E-0.1.0";
export const parentRuleId = "E-0.1";

export async function run(context) {
  const { root, packageJson } = context;
  let content;
  try {
    content = await readRepositoryText(context, join(root, "AGENTS.md"));
  } catch {
    return fail(ruleId, "AGENTS.md is required at the repository root.");
  }
  const missingSections = findMissingAgentsSections(content, packageJson);
  if (missingSections.length > 0) {
    return fail(ruleId, `AGENTS.md is missing required sections: ${missingSections.join(", ")}.`);
  }
  return pass(ruleId);
}
