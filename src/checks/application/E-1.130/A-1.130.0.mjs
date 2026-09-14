import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.130.0";
export const parentRuleId = "E-1.130";

export async function run({ root }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    if (!/application/i.test(agents))
      return fail(ruleId, "AGENTS.md must document applicable application requirements.");
  } catch {
    return fail(ruleId, "Application repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
