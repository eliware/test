import { executeConventionCheck } from "./execute-convention-check.mjs";
import { filterConventionChecksForExecution } from "./filter-convention-checks-for-execution.mjs";
import { runValidationStages } from "../orchestration/run-validation-stages.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  const stageFailures = await runValidationStages(
    context,
    ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"],
    context.validationStageRunners,
  );
  const results = [...stageFailures];
  for (const check of selected) results.push(await executeConventionCheck(check, context));
  if (results.some(({ status }) => status === "fail")) {
    context.stageResults ??= {};
    context.stageResults.jest = {
      ruleId: "stage:jest",
      stage: "jest",
      code: null,
      status: "skip",
      message: "Jest skipped because a pre-Jest stage or check failed.",
    };
    return results;
  }
  results.push(...(await runValidationStages(context, ["jest"], context.validationStageRunners)));
  return results;
}
