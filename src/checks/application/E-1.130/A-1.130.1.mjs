import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.130.1";
export const parentRuleId = "E-1.130";

export async function run({ root }) {
  try {
    const readme = await readFile(join(root, "README.md"), "utf8");
    if (!/workflow/i.test(readme))
      return fail(ruleId, "Application README.md must identify externally observable workflows.");
  } catch {
    return fail(ruleId, "Application README.md is required.");
  }
  return pass(ruleId);
}
