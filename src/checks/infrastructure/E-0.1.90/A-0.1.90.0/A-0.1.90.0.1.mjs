import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.90.0.1";
export const parentRuleId = "A-0.1.90.0";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
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
