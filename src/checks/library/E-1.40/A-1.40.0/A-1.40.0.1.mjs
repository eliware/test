import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.40.0.1";
export const parentRuleId = "A-1.40.0";

const terms = ["api", "exports", "declarations", "compatibility", "packaging", "consumer"];

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = terms.filter((term) => !text.includes(term));
    return missing.length
      ? fail(ruleId, `AGENTS.md is missing library topics: ${missing.join(", ")}.`)
      : pass(ruleId);
  } catch {
    return fail(ruleId, "AGENTS.md is required before library requirements can be reviewed.");
  }
}
