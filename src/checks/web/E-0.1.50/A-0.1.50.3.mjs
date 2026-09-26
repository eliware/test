import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.50.3";
export const parentRuleId = "E-0.1.50";

export async function run(context) {
  const { root } = context;
  try {
    const readme = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    for (const term of [
      "purpose",
      "requirements",
      "setup",
      "configuration",
      "routes",
      "assets",
      "ports",
      "usage",
      "browser",
      "operations",
      "security",
      "support",
      "license",
    ]) {
      if (!readme.includes(term)) return fail(ruleId, `Web README.md must document ${term}.`);
    }
  } catch {
    return fail(ruleId, "Web README.md is required.");
  }
  return pass(ruleId);
}
