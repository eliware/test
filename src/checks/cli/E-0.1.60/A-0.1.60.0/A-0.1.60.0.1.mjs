import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.60.0.1";
export const parentRuleId = "A-0.1.60.0";

export async function run(context) {
  const { root } = context;
  try {
    const agents = await readRepositoryText(context, join(root, "AGENTS.md"));
    const missing = [
      "CLI",
      "entrypoint",
      "--help",
      "--version",
      "commands",
      "supported platforms",
      "validation evidence",
    ].filter((term) => !agents.toLowerCase().includes(term.toLowerCase()));
    if (missing.length)
      return fail(
        ruleId,
        missing.map((term) => `AGENTS.md must document CLI ${term} behavior.`).join("\n"),
      );
  } catch {
    return fail(ruleId, "AGENTS.md must document CLI entrypoints and supported behavior.");
  }
  return pass(ruleId);
}
