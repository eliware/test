import { fail, pass } from "../../../check-result.mjs";
import { readKnitScript } from "./read-knit-script.mjs";
import { commandTokens } from "./knit-command-tokens.mjs";
import { normalizeKnitExecutable } from "./normalize-knit-executable.mjs";

export const ruleId = "E-0.1.10.1";
export const parentRuleId = "E-0.1.10";

export async function run(context) {
  try {
    const { parsed, error } = await readKnitScript(context);
    if (error) return fail(ruleId, error);
    if (parsed.error) return fail(ruleId, parsed.error);
    const commands = parsed.calls.map((call) => {
      const tokens = commandTokens(call);
      if (!tokens) return null;
      const executable = normalizeKnitExecutable(tokens[0]);
      return executable ? [executable, ...tokens.slice(1)] : null;
    });
    const required = [
      ["git", "pull", "--ff-only", "origin", "main"],
      ["npm", "ci"],
      ["npm", "test"],
    ];
    const failures = [];
    if (parsed.leadingExecutable)
      failures.push(
        ".knit/validate.mjs must begin with the required synchronization and validation command sequence.",
      );
    if (commands.some((command) => command === null))
      failures.push(".knit/validate.mjs contains a command that cannot be inspected.");
    if (commands.length !== required.length)
      failures.push(
        ".knit/validate.mjs must contain only git pull, npm ci, and npm test, in that order.",
      );
    for (const [index, expected] of required.entries()) {
      if (commands[index] && JSON.stringify(commands[index]) !== JSON.stringify(expected))
        failures.push(`.knit/validate.mjs command ${index + 1} must be ${expected.join(" ")}.`);
    }
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  return pass(ruleId);
}
