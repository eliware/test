import { fail, pass } from "../../../check-result.mjs";
import { executeAuditProcess } from "./execute-audit-process.mjs";
import { runNpmAudit } from "./run-npm-audit.mjs";
import { runChild as defaultRunChild } from "./run-child.mjs";
import {
  formatNpmAuditFailure,
  formatNpmAuditStartupFailure,
} from "./format-npm-audit-diagnostic.mjs";
import { isSuccessfulNpmAuditReport } from "./is-successful-npm-audit-report.mjs";
import { validateAuditArguments } from "./validate-audit-arguments.mjs";
import { resolveSelfHostedScriptCommands } from "./resolve-self-hosted-script-commands.mjs";
import { getAuditDependencyRequirements } from "./get-audit-dependency-requirements.mjs";

export const ruleId = "E-0.1.20.19";
export const parentRuleId = "E-0.1.20";

export async function run({
  packageJson,
  root,
  executeAudit = false,
  mode = null,
  toolArgs = [],
  runAudit = runNpmAudit,
  runChild = defaultRunChild,
  env = process.env,
}) {
  const auditScript =
    packageJson?.name === "@eliware/test"
      ? resolveSelfHostedScriptCommands(["audit"]).scripts.audit
      : "eliware-test --audit";
  if (packageJson?.scripts?.audit !== auditScript) {
    return fail(
      ruleId,
      "The aggregate validation must execute the shared audit stage through npm run audit.",
    );
  }
  if (!executeAudit && mode !== "audit") return pass(ruleId);
  const argumentError = validateAuditArguments(toolArgs);
  if (argumentError) return fail(ruleId, argumentError);
  try {
    const result = await executeAuditProcess({ root, runAudit, runChild, toolArgs, env });
    if (result.code !== 0) {
      return fail(ruleId, formatNpmAuditFailure(result, env));
    }
    if (!isSuccessfulNpmAuditReport(result.stdout, getAuditDependencyRequirements(packageJson))) {
      return fail(ruleId, "npm audit returned an invalid JSON report.");
    }
  } catch (error) {
    return fail(ruleId, formatNpmAuditStartupFailure(error, env));
  }
  return pass(ruleId);
}
