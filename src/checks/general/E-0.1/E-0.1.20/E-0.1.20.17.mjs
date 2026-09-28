import { fail, pass } from "../../../check-result.mjs";
import { runPrettier } from "../../../run-prettier.mjs";
import { validateRequiredScripts } from "./validate-required-scripts.mjs";
import { executeFormatterValidation } from "./execute-formatter-validation.mjs";
import { resolveFormatterScriptPolicy } from "./resolve-formatter-script-policy.mjs";

export const ruleId = "E-0.1.20.17";
export const parentRuleId = "E-0.1.20";
export const focusedSafe = true;

export async function run({
  packageJson,
  root,
  executeFormat = false,
  mode = null,
  runFormatter = runPrettier,
  toolArgs = [],
  focusedScope = null,
  env = process.env,
}) {
  const findings = [];
  const supportedMode = mode === null || mode === "format" || mode === "format-check";
  if (!supportedMode) findings.push(`Unsupported formatter mode: ${mode}.`);

  const scriptError = validateRequiredScripts(
    packageJson?.scripts,
    resolveFormatterScriptPolicy(packageJson),
  );
  if (scriptError) findings.push(scriptError);

  if (supportedMode) {
    try {
      const formatterError = await executeFormatterValidation({
        root,
        executeFormat,
        mode,
        runFormatter,
        toolArgs,
        focusedScope,
        env,
      });
      if (formatterError) findings.push(formatterError);
    } catch (error) {
      findings.push(`Prettier validation failed: ${error.message}`);
    }
  }
  return findings.length ? fail(ruleId, findings.join("\n")) : pass(ruleId);
}
