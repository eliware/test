import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.130.0";
export const parentRuleId = "E-0.1.130";

export async function run(context) {
  const { root } = context;
  try {
    const agents = await readRepositoryText(context, join(root, "AGENTS.md"));
    if (!/application/i.test(agents))
      return fail(ruleId, "AGENTS.md must document applicable application requirements.");
  } catch {
    return fail(ruleId, "Application repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
