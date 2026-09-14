import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.100.0.1";
export const parentRuleId = "A-1.100.0";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = [
      "documentation",
      "scope",
      "authority",
      "index",
      "link",
      "validation",
      "repository",
    ].filter((term) => !text.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md is missing documentation boundaries: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required before documentation boundaries can be reviewed.");
  }
  return pass(ruleId);
}
