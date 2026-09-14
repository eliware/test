import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.90.0.1";
export const parentRuleId = "A-1.90.0";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = [
      "managed targets",
      "ownership",
      "validation",
      "change control",
      "rollback",
      "secret",
      "desired state",
      "runtime",
    ].filter((term) => !text.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md is missing infrastructure boundaries: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required before infrastructure boundaries can be reviewed.");
  }
  return pass(ruleId);
}
