import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { validateExamplesIndex } from "./validate-examples-index.mjs";

export const ruleId = "A-0.1.40.3";
export const parentRuleId = "E-0.1.40";

export async function run(context) {
  const { root } = context;
  try {
    const readme = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    for (const term of [
      "purpose",
      "requirements",
      "setup",
      "configuration",
      "usage",
      "api",
      "validation",
      "packaging",
      "security",
      "support",
      "license",
      "docs/",
      "examples/",
    ]) {
      if (!readme.includes(term)) return fail(ruleId, `Library README.md must document ${term}.`);
    }
    const examples = await readRepositoryText(context, join(root, "examples", "README.md")).catch(() => null);
    if (examples) {
      const error = validateExamplesIndex(examples);
      if (error) return fail(ruleId, error);
    }
  } catch {
    return fail(ruleId, "Library README.md is required.");
  }
  return pass(ruleId);
}
