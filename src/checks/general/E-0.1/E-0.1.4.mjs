import { fail, pass } from "../../check-result.mjs";
import { runOxlint } from "./E-0.1.4/run-oxlint.mjs";
import { validateOxlintArguments } from "./E-0.1.4/validate-oxlint-arguments.mjs";

export const ruleId = "E-0.1.4";
export const parentRuleId = "E-0.1";
export const focusedSafe = true;

export async function run({
  packageJson,
  root,
  executeLint = false,
  mode = null,
  runLint = runOxlint,
  toolArgs = [],
  focusedScope = null,
}) {
  if (typeof packageJson?.scripts?.lint !== "string" || !packageJson.scripts.lint.trim()) {
    return fail(ruleId, "Repositories must define a lint validation command.");
  }
  if (!(executeLint || mode === "lint") || (mode !== null && mode !== "lint")) return pass(ruleId);
  const argumentError = validateOxlintArguments(toolArgs);
  if (argumentError) return fail(ruleId, argumentError);
  try {
    const result = await runLint(root, undefined, undefined, toolArgs, focusedScope?.paths ?? []);
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return fail(
        ruleId,
        detail ? `Oxlint failed: ${detail}` : "Oxlint failed without diagnostics.",
      );
    }
    return pass(ruleId);
  } catch (error) {
    return fail(ruleId, `Oxlint could not be started: ${error.message}`);
  }
}
