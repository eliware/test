import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.130.0.1";
export const parentRuleId = "A-0.1.130.0";

export async function run(context) {
  const { root } = context;
  try {
    const agents = await readRepositoryText(context, join(root, "AGENTS.md"));
    const section =
      agents
        .split(/^## Application\s*$/imu)[1]
        ?.split(/^##\s+/mu)[0]
        ?.toLowerCase() ?? "";
    const requirements = [
      ["entrypoint", "executable"],
      ["lifecycle", "shutdown", "signal"],
      ["configuration", "runtime"],
      ["boundary", "safe", "read-only", "without modifying"],
    ];
    const missing = requirements
      .filter((group) => !group.some((term) => section.includes(term)))
      .map((group) => group[0]);
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md must document application concerns: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "Application repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
