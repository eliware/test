import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readRepositoryText } from "../../../read-repository-text.mjs";
import { parseKnitScript } from "./parse-knit-script.mjs";
import { commandTokens } from "./knit-command-tokens.mjs";

export const ruleId = "E-0.1.10.1";
export const parentRuleId = "E-0.1.10";

const parserOptions = { sourceType: "module", plugins: ["importAttributes", "topLevelAwait"] };

export async function run(context) {
  const { root, parseAst } = context;
  try {
    const source = parseAst
      ? ""
      : await readRepositoryText(context, join(root, ".knit", "validate.mjs"));
    let ast = null;
    if (parseAst) {
      try {
        ast = await parseAst(root, ".knit/validate.mjs", parserOptions);
      } catch (error) {
        return fail(ruleId, `Knit validation script is not valid JavaScript: ${error.message}`);
      }
    }
    const parsed = parseKnitScript(source, ast);
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
