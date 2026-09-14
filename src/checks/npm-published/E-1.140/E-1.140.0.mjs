import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.140.0";
export const parentRuleId = "E-1.140";

export async function run({ root }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    if (!/npm|publication|publish/i.test(agents))
      return fail(ruleId, "AGENTS.md must document npm publication requirements.");
  } catch {
    return fail(ruleId, "AGENTS.md must document npm publication requirements.");
  }
  return pass(ruleId);
}
