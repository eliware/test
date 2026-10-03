import { fail, pass } from "../../../check-result.mjs";
import { executeAuditProcess } from "./execute-audit-process.mjs";
import { runNpmAudit } from "./run-npm-audit.mjs";
import { runChild as defaultRunChild } from "./run-child.mjs";
import {
  formatNpmAuditFailure,
  formatNpmAuditStartupFailure,
} from "./format-npm-audit-diagnostic.mjs";
import { getValidNpmAuditReport } from "./is-successful-npm-audit-report.mjs";
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
  resolveCommand,
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
    const result = await executeAuditProcess({
      root,
      runAudit,
      runChild,
      resolveCommand,
      toolArgs,
      env,
    });
    if (result.code !== 0) {
      return fail(ruleId, formatNpmAuditFailure(result, env));
    }
    const report = getValidNpmAuditReport(
      result.stdout,
      getAuditDependencyRequirements(packageJson),
    );
    if (!report) {
      return fail(ruleId, "npm audit returned an invalid JSON report.");
    }
    const hasHighSeverityFinding = Object.values(report.vulnerabilities).some(
      ({ severity }) => severity === "high" || severity === "critical",
    );
    if (
      hasHighSeverityFinding ||
      report.metadata.vulnerabilities.high > 0 ||
      report.metadata.vulnerabilities.critical > 0
    )
      return fail(ruleId, formatNpmAuditFailure({ ...result, code: 1 }, env));
  } catch (error) {
    return fail(ruleId, formatNpmAuditStartupFailure(error, env));
  }
  return pass(ruleId);
}
