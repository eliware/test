import { executeConventionCheck } from "./check.mjs";
import { filterConventionChecksForExecution } from "../../filter-convention-checks-for-execution.mjs";
import { runValidationStages } from "../../../stages/run-validation-stages.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  const stageFailures = await runValidationStages(
    context,
    ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"],
    context.validationStageRunners,
  );
  context.validationSummary ??= {};
  const completedStages = Object.values(context.stageResults).filter(
    (result) => result.status === "pass" && result.stage !== "jest",
  ).length;
  context.validationSummary.checkCount = selected.length + completedStages;
  const results = [...stageFailures];
  for (const check of selected) {
    const paths = exemptions instanceof Set ? [] : (exemptions.get(check.ruleId) ?? []);
    results.push(await executeConventionCheck(check, context, paths));
  }
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
