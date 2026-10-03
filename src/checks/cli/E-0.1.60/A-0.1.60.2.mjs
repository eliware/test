import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.60.2";
export const parentRuleId = "E-0.1.60";

export async function run(context) {
  const { root } = context;
  try {
    const readme = await readRepositoryText(context, join(root, "README.md"));
    const missing = [
      "## Commands",
      "## Exit codes",
      "--help",
      "--version",
      "supported platforms",
      "validation evidence",
    ].filter((term) => !readme.toLowerCase().includes(term.toLowerCase()));
    if (missing.length)
      return fail(ruleId, missing.map((term) => `CLI README.md must document ${term}.`).join("\n"));
  } catch {
    return fail(ruleId, "README.md must document the CLI contract.");
  }
  return pass(ruleId);
}
