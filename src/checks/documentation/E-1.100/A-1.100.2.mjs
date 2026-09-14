import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.100.2";
export const parentRuleId = "E-1.100";

export async function run({ root }) {
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
    const missing = [
      "scope",
      "authority",
      "navigation",
      "contribution",
      "validation",
      "security",
      "support",
      "license",
    ].filter((term) => !readme.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `Documentation README.md is missing: ${missing.join(", ")}.`);
    if (!readme.includes("docs/"))
      return fail(ruleId, "Documentation README.md must link the documentation surface.");
  } catch {
    return fail(ruleId, "Documentation repositories require a root README.md file.");
  }
  return pass(ruleId);
}
