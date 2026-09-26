import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.60.0.1";
export const parentRuleId = "A-0.1.60.0";

export async function run(context) {
  const { root } = context;
  try {
    const agents = await readRepositoryText(context, join(root, "AGENTS.md"));
    for (const term of ["CLI", "entrypoint", "--help", "--version", "commands"]) {
      if (!agents.toLowerCase().includes(term.toLowerCase()))
        return fail(ruleId, `AGENTS.md must document CLI ${term} behavior.`);
    }
  } catch {
    return fail(ruleId, "AGENTS.md must document CLI entrypoints and supported behavior.");
  }
  return pass(ruleId);
}
