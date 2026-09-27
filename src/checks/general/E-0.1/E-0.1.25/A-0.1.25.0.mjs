import { readRepositoryText } from "../../../read-repository-text.mjs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.25.0";
export const parentRuleId = "E-0.1.25";

export async function run(context) {
  const { root } = context;
  const required = ["authority.json", "directives.json"];
  try {
    const index = await readRepositoryText(context, join(root, "specs", "README.md"));
    for (const file of required) {
      await access(join(root, "specs", file));
      if (!index.includes(file)) return fail(ruleId, `specs/README.md must link ${file}.`);
    }
  } catch {
    return fail(ruleId, "specs/ must contain README.md, authority.json, and directives.json.");
  }
  return pass(ruleId);
}
