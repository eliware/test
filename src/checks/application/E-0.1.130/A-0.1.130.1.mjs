import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { validateApplicationReadmeContent } from "./validate-application-readme-content.mjs";
import { validateApplicationReadmeStructure } from "./validate-application-readme-structure.mjs";

export const ruleId = "A-0.1.130.1";
export const parentRuleId = "E-0.1.130";

export async function run(context) {
  const { root } = context;
  try {
    const readme = await readRepositoryText(context, join(root, "README.md"));
    const failures = [
      validateApplicationReadmeStructure(readme),
      validateApplicationReadmeContent(readme),
    ].filter(Boolean);
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch {
    return fail(ruleId, "Application README.md is required.");
  }
  return pass(ruleId);
}
