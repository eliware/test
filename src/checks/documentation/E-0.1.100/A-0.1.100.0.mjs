import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.100.0";
export const parentRuleId = "E-0.1.100";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    const missing = ["documentation", "scope", "index", "link", "validation"].filter(
      (term) => !text.includes(term),
    );
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md is missing documentation topics: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Documentation repositories require a root AGENTS.md file.");
  }
  return pass(ruleId);
}
