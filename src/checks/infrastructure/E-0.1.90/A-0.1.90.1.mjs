import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.90.1";
export const parentRuleId = "E-0.1.90";

export async function run(context) {
  const { root } = context;
  try {
    const readme = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    const missing = [
      "purpose",
      "managed targets",
      "requirements",
      "setup",
      "configuration",
      "desired state",
      "validation",
      "change boundaries",
      "security",
      "support",
      "license",
    ].filter((term) => !readme.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `Infrastructure README.md is missing: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Infrastructure repositories require a root README.md file.");
  }
  return pass(ruleId);
}
