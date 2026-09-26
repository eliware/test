import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.40.0.1";
export const parentRuleId = "A-0.1.40.0";

const terms = ["api", "exports", "declarations", "compatibility", "packaging", "consumer"];

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
    const missing = terms.filter((term) => !text.includes(term));
    return missing.length
      ? fail(ruleId, `AGENTS.md is missing library topics: ${missing.join(", ")}.`)
      : pass(ruleId);
  } catch {
    return fail(ruleId, "AGENTS.md is required before library requirements can be reviewed.");
  }
}
