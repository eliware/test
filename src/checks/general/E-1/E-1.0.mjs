import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pass } from "../../check-result.mjs";
import { fail } from "../../check-result.mjs";
import { findMissingAgentsSections } from "./validate-agents-required-sections.mjs";

export const ruleId = "E-1.0";
export const parentRuleId = "E-1";

const authorityReferences = ["eliware/docs", "eliware/conventions", "eliware/operations"];

export async function run({ root, packageJson }) {
  let content;
  try {
    content = await readFile(join(root, "AGENTS.md"), "utf8");
  } catch {
    return fail(ruleId, "AGENTS.md is required at the repository root.");
  }
  const missing = authorityReferences.filter((reference) => !content.includes(reference));
  if (missing.length > 0) {
    return fail(ruleId, `AGENTS.md must reference: ${missing.join(", ")}.`);
  }
  const missingSections = findMissingAgentsSections(content, packageJson);
  if (missingSections.length > 0) {
    return fail(ruleId, `AGENTS.md is missing required sections: ${missingSections.join(", ")}.`);
  }
  return pass(ruleId);
}
