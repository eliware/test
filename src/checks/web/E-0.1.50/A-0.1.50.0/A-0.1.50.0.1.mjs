import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.50.0.1";
export const parentRuleId = "A-0.1.50.0";

const terms = ["routes", "assets", "configuration", "browser", "deployment", "port"];

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    const missing = terms.filter((term) => !text.includes(term));
    return missing.length === 0
      ? pass(ruleId)
      : fail(ruleId, `AGENTS.md must document web concerns: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required before web requirements can be reviewed.");
  }
}
