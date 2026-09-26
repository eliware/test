import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.20.0";
export const parentRuleId = "E-0.1.20";

export async function run(context) {
  const { root } = context;
  try {
    const content = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    const missing = [
      "node.js 26",
      "native esm",
      ".mjs",
      "module",
      "environment",
      "validation",
    ].filter((term) => !content.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md must document Node.js validation: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required for Node.js validation guidance.");
  }
  return pass(ruleId);
}
