import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.60.2";
export const parentRuleId = "E-0.1.60";

export async function run(context) {
  const { root } = context;
  try {
    const readme = await readRepositoryText(context, join(root, "README.md"));
    for (const term of ["## Commands", "## Exit codes", "--help", "--version", "platform"]) {
      if (!readme.toLowerCase().includes(term.toLowerCase()))
        return fail(ruleId, `CLI README.md must document ${term}.`);
    }
  } catch {
    return fail(ruleId, "README.md must document the CLI contract.");
  }
  return pass(ruleId);
}
