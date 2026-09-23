import { fail, pass } from "../../../check-result.mjs";
import { runNpmAudit } from "./run-npm-audit.mjs";
import { runChild } from "./run-child.mjs";
import { collectRedactionSecrets, redactProcessOutput } from "../../../redact-process-output.mjs";

export const ruleId = "E-1.20.19";
export const parentRuleId = "E-1.20";

export async function run({
  packageJson,
  root,
  executeAudit = false,
  runAudit = runNpmAudit,
  toolArgs = [],
    env = process.env,
}) {
  if (packageJson?.scripts?.audit !== "eliware-test --audit") {
    return fail(
      ruleId,
      "The aggregate validation must execute the shared audit stage through npm run audit.",
    );
  }
  if (!executeAudit) return pass(ruleId);
  const redactionSecrets = collectRedactionSecrets(env);
  try {
    const result = await runAudit(root, runChild, undefined, toolArgs);
    if (result.code !== 0) {
      const detail = redactProcessOutput([result.stdout, result.stderr].filter(Boolean).join("\n").trim(), redactionSecrets);
      return fail(
        ruleId,
        detail ? `npm audit failed: ${detail}` : "npm audit failed without diagnostics.",
      );
    }
  } catch (error) {
    return fail(ruleId, `npm audit could not be started: ${redactProcessOutput(error.message, redactionSecrets)}`);
  }
  return pass(ruleId);
}
