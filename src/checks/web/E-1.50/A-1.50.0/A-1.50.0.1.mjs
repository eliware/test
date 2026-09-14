import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.50.0.1";
export const parentRuleId = "A-1.50.0";

const terms = ["routes", "assets", "configuration", "browser", "deployment", "port"];

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = terms.filter((term) => !text.includes(term));
    return missing.length === 0
      ? pass(ruleId)
      : fail(ruleId, `AGENTS.md must document web concerns: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required before web requirements can be reviewed.");
  }
}
