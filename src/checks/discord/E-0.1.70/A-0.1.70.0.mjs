import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.70.0";
export const parentRuleId = "E-0.1.70";

export async function run(context) {
  const { root } = context;
  try {
    const text = (await readRepositoryText(context, join(root, "AGENTS.md"))).toLowerCase();
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
