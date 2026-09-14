import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { commandTokens, parseKnitScript } from "./parse-knit-script.mjs";

export const ruleId = "E-1.10.1";
export const parentRuleId = "E-1.10";

export async function run({ root }) {
  try {
    const parsed = parseKnitScript(await readFile(join(root, ".knit", "validate.mjs"), "utf8"));
    if (parsed.error) return fail(ruleId, parsed.error);
    if (parsed.leadingExecutable) {
      return fail(
        ruleId,
        ".knit/validate.mjs must begin with the required synchronization and validation command sequence.",
      );
    }
    const commands = parsed.calls.map(commandTokens);
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
