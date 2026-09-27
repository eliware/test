import { fail, pass } from "../../../check-result.mjs";
import { readKnitScript } from "./read-knit-script.mjs";
import { validateKnitCommandStructure } from "./validate-knit-command-structure.mjs";
import { validateKnitSourceOperations } from "./validate-knit-source-operations.mjs";
import { validateKnitPublicationCommands } from "./validate-knit-publication-commands.mjs";

export const ruleId = "E-0.1.10.0";
export const parentRuleId = "E-0.1.10";

export async function run(context) {
  try {
    const { source, parsed, error, ast } = await readKnitScript(context);
    if (error) return fail(ruleId, error);
    if (parsed.error) return fail(ruleId, parsed.error);
    const commandError = validateKnitCommandStructure(parsed);
    if (commandError) return fail(ruleId, commandError);
    const sourceError = validateKnitSourceOperations(source, ast);
    if (sourceError) return fail(ruleId, sourceError);
    const publicationError = validateKnitPublicationCommands(parsed.calls);
    if (publicationError) return fail(ruleId, publicationError);
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  return pass(ruleId);
}
