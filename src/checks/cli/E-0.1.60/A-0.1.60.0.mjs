import { readRepositoryParsed } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.60.0";
export const parentRuleId = "E-0.1.60";

export async function run(context) {
  const { root } = context;
  try {
    const section = await readRepositoryParsed(
      context,
      join(root, "AGENTS.md"),
      "agents:section:cli",
      (agents) =>
        agents
          .split(/^## CLI\s*$/imu)[1]
          ?.split(/^##\s+/mu)[0]
          ?.toLowerCase() ?? "",
    );
    const requirements = [
      ["entrypoint", "executable"],
      ["parse", "argument", "option", "delimiter", "prompt text", "repeatable"],
      ["default"],
      ["validation", "error"],
      ["exit code"],
      ["platform", "windows", "macos", "linux", "ubuntu"],
      ["--help"],
      ["--version"],
      ["dry-run", "confirmation", "read-only", "destructive"],
    ];
    const missing = requirements
      .filter((group) => !group.some((term) => section.includes(term)))
      .map((group) => group[0]);
    if (missing.length > 0)
      return fail(
        ruleId,
        `AGENTS.md CLI section is missing required guidance: ${missing.join(", ")}.`,
      );
  } catch {
    return fail(ruleId, "CLI repositories must contain AGENTS.md.");
  }
  return pass(ruleId);
}
