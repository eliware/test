import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.50.0";
export const parentRuleId = "E-1.50";

export async function run({ root }) {
  try {
    await access(join(root, "AGENTS.md"));
    return pass(ruleId);
  } catch {
    return fail(ruleId, "Web repositories require a root AGENTS.md file.");
  }
}
