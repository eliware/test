import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.70.2";
export const parentRuleId = "E-1.70";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
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
