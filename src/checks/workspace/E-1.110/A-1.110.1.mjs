import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.110.1";
export const parentRuleId = "E-1.110";

export async function run({ root }) {
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
    const missing = [
      "purpose",
      "role",
      "boundary",
      "authority",
      "runbook",
      "communication",
      "validation",
      "security",
      "support",
      "recovery",
    ].filter((term) => !readme.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `Workspace README.md is missing: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Workspace repositories require a root README.md file.");
  }
  return pass(ruleId);
}
