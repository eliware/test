import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.130.0.1";
export const parentRuleId = "A-1.130.0";

export async function run({ root }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    const missing = ["configuration", "shutdown", "workflow"].filter(
      (term) => !agents.toLowerCase().includes(term),
    );
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md must document application concerns: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Application repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
