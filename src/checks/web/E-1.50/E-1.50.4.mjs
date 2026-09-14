import { fail, pass } from "../../check-result.mjs";
import { runNpmScript } from "../../run-npm-script.mjs";

export const ruleId = "E-1.50.4";
export const parentRuleId = "E-1.50";

export async function run({
  packageJson,
  root,
  executePackageChecks = false,
  mode = null,
  runScript = runNpmScript,
}) {
  if (typeof packageJson?.scripts?.build !== "string" || !packageJson.scripts.build.trim()) {
    return fail(ruleId, "Web applications must define a nonempty build script.");
  }
  if (!executePackageChecks || mode !== null) return pass(ruleId);
  try {
    const result = await runScript(root, "build");
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return fail(ruleId, detail ? `build failed: ${detail}` : "build failed without diagnostics.");
    }
  } catch (error) {
    return fail(ruleId, `build could not be started: ${error.message}`);
  }
  return pass(ruleId);
}
