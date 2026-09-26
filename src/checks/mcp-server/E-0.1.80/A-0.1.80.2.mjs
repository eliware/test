import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.80.2";
export const parentRuleId = "E-0.1.80";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
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
