import { executeConventionCheck } from "./execute-convention-check.mjs";
import { filterConventionChecksForExecution } from "./filter-convention-checks-for-execution.mjs";
import { runValidationStages } from "../orchestration/run-validation-stages.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  const independent = selected.filter(({ executionPhase }) => !executionPhase);
  const jest = selected.filter(({ executionPhase }) => executionPhase === "jest");
  const dependent = selected.filter(({ executionPhase }) => executionPhase === "jest-dependent");
  const stageFailures = await runValidationStages(
    context,
    ["lint", "format", "audit", "pack"],
    context.validationStageRunners,
  );
  const results = [...stageFailures];
  for (const check of independent) results.push(await executeConventionCheck(check, context));
  if (results.some(({ status }) => status === "fail")) {
    context.stageResults ??= {};
    context.stageResults.jest = {
      ruleId: "stage:jest",
      stage: "jest",
      code: null,
      status: "skip",
      message: "Jest skipped because a pre-Jest stage or check failed.",
    };
    for (const check of [...jest, ...dependent]) {
      context.timing?.skip?.(check.ruleId);
      results.push({
        ruleId: check.ruleId,
        status: "skip",
        message: "Skipped because a Jest-independent check failed.",
      });
    }
    return results;
  }
  results.push(...(await runValidationStages(context, ["jest"], context.validationStageRunners)));
  for (const check of [...jest, ...dependent])
    results.push(await executeConventionCheck(check, context));
  return results;
}
