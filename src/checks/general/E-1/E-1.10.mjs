import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.10";
export const parentRuleId = "E-1";

export async function run({ root }) {
  try {
    await access(join(root, ".knit", "validate.mjs"));
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  return pass(ruleId);
}
