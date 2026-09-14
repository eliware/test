import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { validateExamplesIndex } from "./validate-examples-index.mjs";

export const ruleId = "A-1.40.3";
export const parentRuleId = "E-1.40";

export async function run({ root }) {
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
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
    const examples = await readFile(join(root, "examples", "README.md"), "utf8").catch(() => null);
    if (examples) {
      const error = validateExamplesIndex(examples);
      if (error) return fail(ruleId, error);
    }
  } catch {
    return fail(ruleId, "Library README.md is required.");
  }
  return pass(ruleId);
}
