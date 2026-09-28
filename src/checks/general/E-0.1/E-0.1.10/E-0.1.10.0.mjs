import { fail, pass } from "../../../check-result.mjs";
import { readKnitScript } from "./read-knit-script.mjs";
import { validateKnitCommandStructure } from "./validate-knit-command-structure.mjs";
import { validateKnitSourceOperations } from "./validate-knit-source-operations.mjs";
import { validateKnitPublicationCommands } from "./validate-knit-publication-commands.mjs";

export const ruleId = "E-0.1.10.0";
export const parentRuleId = "E-0.1.10";

export async function run(context) {
  let script;
  try {
    script = await readKnitScript(context);
  } catch {
    return fail(ruleId, ".knit/validate.mjs is required for Knit validation.");
  }
  if (script.error) return fail(ruleId, script.error);
  if (script.parsed.error) return fail(ruleId, script.parsed.error);

  const findings = [];
  for (const [validate, args] of [
    [validateKnitCommandStructure, [script.parsed]],
    [validateKnitSourceOperations, [script.source, script.ast, script.parsed.calls]],
    [validateKnitPublicationCommands, [script.parsed.calls]],
  ]) {
    try {
      const finding = validate(...args);
      if (finding) findings.push(finding);
    } catch (error) {
      findings.push(`Knit policy validation failed: ${error?.message ?? String(error)}`);
    }
  }
  return findings.length ? fail(ruleId, findings.join("\n")) : pass(ruleId);
}
