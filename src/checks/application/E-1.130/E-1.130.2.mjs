import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.130.2";
export const parentRuleId = "E-1.130";

export async function run({ root }) {
  try {
    await access(join(root, "docs", "README.md"));
    const readme = await readFile(join(root, "README.md"), "utf8");
    if (!readme.includes("docs/README.md"))
      return fail(ruleId, "README.md must link docs/README.md for application documentation.");
  } catch {
    return fail(
      ruleId,
      "Application repositories must contain docs/README.md and link it from README.md.",
    );
  }
  return pass(ruleId);
}
