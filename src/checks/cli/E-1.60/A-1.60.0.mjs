import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.60.0";
export const parentRuleId = "E-1.60";

export async function run({ root }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    if (!/cli/i.test(agents))
      return fail(ruleId, "AGENTS.md must document applicable CLI requirements.");
  } catch {
    return fail(ruleId, "CLI repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
