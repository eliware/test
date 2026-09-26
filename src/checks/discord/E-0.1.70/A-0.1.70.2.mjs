import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.70.2";
export const parentRuleId = "E-0.1.70";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    const missing = [
      "purpose",
      "requirements",
      "setup",
      "configuration",
      "commands",
      "events",
      "intents",
      "permissions",
      "validation",
      "operations",
      "security",
      "support",
      "license",
    ].filter((term) => !text.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `Discord README.md is missing: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Discord repositories require a root README.md file.");
  }
  return pass(ruleId);
}
