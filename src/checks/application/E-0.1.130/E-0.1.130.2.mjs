import { readRepositoryText } from "../../read-repository-text.mjs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.130.2";
export const parentRuleId = "E-0.1.130";

export async function run(context) {
  const { root } = context;
  try {
    await access(join(root, "docs", "README.md"));
    const readme = await readRepositoryText(context, join(root, "README.md"));
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
