import { fail, pass } from "../../../check-result.mjs";
import { readKnitScript } from "./read-knit-script.mjs";
import { commandTokens } from "./knit-command-tokens.mjs";
import { normalizeKnitExecutable } from "./normalize-knit-executable.mjs";

export const ruleId = "E-0.1.10.1";
export const parentRuleId = "E-0.1.10";

export async function run(context) {
  try {
    const { parsed, error } = await readKnitScript(context, { includeSource: false });
    if (error) return fail(ruleId, error);
    if (parsed.error) return fail(ruleId, parsed.error);
    if (parsed.leadingExecutable) {
      return fail(
        ruleId,
        ".knit/validate.mjs must begin with the required synchronization and validation command sequence.",
      );
    }
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
    if (commands.some((command) => command === null) || commands.length < required.length) {
      return fail(
        ruleId,
        ".knit/validate.mjs must begin with git pull --ff-only origin main, npm ci, and npm test.",
      );
    }
    for (const [index, expected] of required.entries()) {
      if (JSON.stringify(commands[index]) !== JSON.stringify(expected)) {
        return fail(
          ruleId,
          ".knit/validate.mjs must begin with git pull --ff-only origin main, npm ci, and npm test.",
        );
      }
    }
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  return pass(ruleId);
}
