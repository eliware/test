import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.50.3";
export const parentRuleId = "E-1.50";

export async function run({ root }) {
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
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
