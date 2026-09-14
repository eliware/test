import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.90.1";
export const parentRuleId = "E-1.90";

export async function run({ root }) {
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
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
