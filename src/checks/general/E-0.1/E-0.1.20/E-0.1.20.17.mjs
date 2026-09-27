import { fail, pass } from "../../../check-result.mjs";
import { runPrettier } from "../../../run-prettier.mjs";
import { validateRequiredScripts } from "./validate-required-scripts.mjs";
import { executeFormatterValidation } from "./execute-formatter-validation.mjs";

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
  if (mode !== null && mode !== "format" && mode !== "format-check") {
    return fail(ruleId, `Unsupported formatter mode: ${mode}.`);
  }
  const appliedProfiles = new Set(
    Array.isArray(packageJson?.eliware?.apply) ? packageJson.eliware.apply : [],
  );
  const declaredCapabilities = new Set(
    Array.isArray(packageJson?.eliware?.capabilities) ? packageJson.eliware.capabilities : [],
  );
  const scriptError = validateRequiredScripts(packageJson?.scripts, {
    requiresPack: appliedProfiles.has("npm-published"),
    allowedAdditionalScripts: [
      ...(declaredCapabilities.has("typecheck") ? ["typecheck"] : []),
      ...(declaredCapabilities.has("build") ? ["build"] : []),
      ...(appliedProfiles.has("web") ? ["lighthouse", "puppeteer"] : []),
    ],
  });
  if (scriptError) return fail(ruleId, scriptError);
  const formatterError = await executeFormatterValidation({
    root,
    executeFormat,
    mode,
    runFormatter,
    toolArgs,
    focusedScope,
    env,
  });
  return formatterError === null || formatterError === ""
    ? pass(ruleId)
    : fail(ruleId, formatterError);
}
