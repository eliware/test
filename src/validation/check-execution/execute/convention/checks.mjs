import { executeConventionRules } from "./rules.mjs";
import { filterConventionChecksForExecution } from "../../filter-convention-checks-for-execution.mjs";
import { runValidationStages } from "../../../stages/run-validation-stages.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  context.timing?.stage?.("package stages");
  const stageFailures = await runValidationStages(
    context,
    ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"],
    context.validationStageRunners,
  );
  context.validationSummary ??= {};
  const completedStages = Object.values(context.stageResults).filter(
    (result) => ["pass", "warning"].includes(result.status) && result.stage !== "jest",
  ).length;
  context.timing?.stage?.("convention checks");
  const checkResults = await executeConventionRules(selected, context, exemptions);
  context.validationSummary.checkCount = selected.length + completedStages;
  const results = [...stageFailures, ...checkResults];
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
