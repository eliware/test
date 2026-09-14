import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.80.2";
export const parentRuleId = "E-1.80";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
    const missing = [
      "purpose",
      "requirements",
      "setup",
      "configuration",
      "tools",
      "resources",
      "prompts",
      "transport",
      "authentication",
      "schemas",
      "validation",
      "operations",
      "security",
      "support",
      "license",
    ].filter((term) => !text.includes(term));
    if (missing.length > 0) return fail(ruleId, `MCP README.md is missing: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "MCP repositories require a root README.md file.");
  }
  return pass(ruleId);
}
