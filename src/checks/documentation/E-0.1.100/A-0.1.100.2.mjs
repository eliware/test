import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.100.2";
export const parentRuleId = "E-0.1.100";

export async function run(context) {
  const { root } = context;
  try {
    const readme = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    const missing = [
      "scope",
      "navigation",
      "contribution",
      "validation",
      "security",
      "support",
      "license",
    ].filter((term) => !readme.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `Documentation README.md is missing: ${missing.join(", ")}.`);
    if (!/\[.+?\]\((?:\.\/)?specs\/readme\.md\)/u.test(readme))
      return fail(ruleId, "Documentation README.md must link specs/README.md.");
  } catch {
    return fail(ruleId, "Documentation repositories require a root README.md file.");
  }
  return pass(ruleId);
}
