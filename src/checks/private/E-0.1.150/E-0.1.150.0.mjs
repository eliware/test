import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.150.0";
export const parentRuleId = "E-0.1.150";

export async function run(context) {
  const { root } = context;
  try {
    const agents = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    if (!agents.includes("private") || !agents.includes("distribution"))
      return fail(ruleId, "AGENTS.md must document private distribution restrictions.");
  } catch {
    return fail(ruleId, "Private repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
