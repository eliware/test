import { fail, pass } from "../../check-result.mjs";
import { runNpmScript } from "../../run-npm-script.mjs";

export const ruleId = "E-1.40.6";
export const parentRuleId = "E-1.40";

export async function run({
  packageJson,
  root,
  executePackageChecks = false,
  mode = null,
  runScript = runNpmScript,
}) {
  if (typeof packageJson?.scripts?.typecheck !== "string" || !packageJson.scripts.typecheck.trim())
    return fail(ruleId, "Libraries must define a nonempty typecheck script.");
  if (!executePackageChecks || mode !== null) return pass(ruleId);
  try {
    const result = await runScript(root, "typecheck");
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return fail(
        ruleId,
        detail ? `typecheck failed: ${detail}` : "typecheck failed without diagnostics.",
      );
    }
  } catch (error) {
    return fail(ruleId, `typecheck could not be started: ${error.message}`);
  }
  return pass(ruleId);
}
