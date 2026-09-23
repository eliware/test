import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.60.2";
export const parentRuleId = "E-1.60";

export async function run({ root }) {
  try {
    const readme = await readFile(join(root, "README.md"), "utf8");
    for (const term of [
      "## Commands",
      "## Exit codes",
      "--help",
      "--version",
      "platform",
    ]) {
      if (!readme.toLowerCase().includes(term.toLowerCase()))
        return fail(ruleId, `CLI README.md must document ${term}.`);
    }
  } catch {
    return fail(ruleId, "README.md must document the CLI contract.");
  }
  return pass(ruleId);
}
