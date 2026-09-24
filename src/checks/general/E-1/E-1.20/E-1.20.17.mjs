import { fail, pass } from "../../../check-result.mjs";
import { runPrettier } from "../../../run-prettier.mjs";
import { validateRequiredScripts } from "./validate-required-scripts.mjs";
import { executeFormatterValidation } from "./execute-formatter-validation.mjs";

export const ruleId = "E-1.20.17";
export const parentRuleId = "E-1.20";
export const focusedSafe = true;

export async function run({
  packageJson,
  root,
  executeFormat = false,
  mode = null,
  runFormatter = runPrettier,
  toolArgs = [],
  focusedScope = null,
}) {
  if (mode !== null && mode !== "format" && mode !== "format-check") {
    return fail(ruleId, `Unsupported formatter mode: ${mode}.`);
  }
  const scriptError = validateRequiredScripts(packageJson?.scripts);
  if (scriptError) return fail(ruleId, scriptError);
  const formatterError = await executeFormatterValidation({
    root,
    executeFormat,
    mode,
    runFormatter,
    toolArgs,
    focusedScope,
  });
  return formatterError === null || formatterError === ""
    ? pass(ruleId)
    : fail(ruleId, formatterError);
}
