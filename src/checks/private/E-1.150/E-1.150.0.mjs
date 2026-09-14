import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.150.0";
export const parentRuleId = "E-1.150";

export async function run({ root }) {
  try {
    const agents = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    if (!agents.includes("private") || !agents.includes("distribution"))
      return fail(ruleId, "AGENTS.md must document private distribution restrictions.");
  } catch {
    return fail(ruleId, "Private repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
