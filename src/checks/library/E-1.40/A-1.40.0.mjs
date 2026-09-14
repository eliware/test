import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.40.0";
export const parentRuleId = "E-1.40";

export async function run({ root }) {
  try {
    await access(join(root, "AGENTS.md"));
    return pass(ruleId);
  } catch {
    return fail(ruleId, "Library repositories require a root AGENTS.md file.");
  }
}
