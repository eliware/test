import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.60.0.1";
export const parentRuleId = "A-1.60.0";

export async function run({ root }) {
  try {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    for (const term of ["CLI", "entrypoint", "--help", "--version", "commands"]) {
      if (!agents.toLowerCase().includes(term.toLowerCase()))
        return fail(ruleId, `AGENTS.md must document CLI ${term} behavior.`);
    }
  } catch {
    return fail(ruleId, "AGENTS.md must document CLI entrypoints and supported behavior.");
  }
  return pass(ruleId);
}
