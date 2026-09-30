import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.10";
export const parentRuleId = "E-0.1";

export async function run({ root }) {
  try {
    await access(join(root, ".knit", "deploy.yaml"));
  } catch {
    return fail(ruleId, ".knit/deploy.yaml is required for Knit configuration.");
  }
  return pass(ruleId);
}
