import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.130.1";
export const parentRuleId = "E-0.1.130";

export async function run(context) {
  const { root } = context;
  try {
    const readme = await readRepositoryText(context, join(root, "README.md"));
    if (!/workflow/i.test(readme))
      return fail(ruleId, "Application README.md must identify externally observable workflows.");
  } catch {
    return fail(ruleId, "Application README.md is required.");
  }
  return pass(ruleId);
}
