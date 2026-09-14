import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.70.0";
export const parentRuleId = "E-1.70";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    if (["discord", "configuration", "validation"].some((term) => !text.includes(term)))
      return fail(
        ruleId,
        "Discord repositories must document Discord configuration and validation in AGENTS.md.",
      );
  } catch {
    return fail(ruleId, "Discord repositories require a root AGENTS.md file.");
  }
  return pass(ruleId);
}
