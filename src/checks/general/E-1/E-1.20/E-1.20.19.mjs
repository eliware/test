import { fail, pass } from "../../../check-result.mjs";
import { runNpmAudit } from "./run-npm-audit.mjs";

export const ruleId = "E-1.20.19";
export const parentRuleId = "E-1.20";

export async function run({
  packageJson,
  root,
  executeAudit = false,
  mode = null,
  runAudit = runNpmAudit,
}) {
  if (packageJson?.scripts?.audit !== "eliware-test --audit") {
    return fail(
      ruleId,
      "The aggregate validation must execute the shared audit stage through npm run audit.",
    );
  }
  if (!executeAudit || (mode !== null && mode !== "audit")) return pass(ruleId);
  try {
    const result = await runAudit(root);
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return fail(
        ruleId,
        detail ? `npm audit failed: ${detail}` : "npm audit failed without diagnostics.",
      );
    }
  } catch (error) {
    return fail(ruleId, `npm audit could not be started: ${error.message}`);
  }
  return pass(ruleId);
}
