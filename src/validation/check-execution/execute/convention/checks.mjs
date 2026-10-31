import { executeConventionRules } from "./rules.mjs";
import { filterConventionChecksForExecution } from "../../filter-convention-checks-for-execution.mjs";
import { runValidationStages } from "../../../stages/run-validation-stages.mjs";
import {
  countCompletedPackageStages,
  executeInitialPackageStages,
  executeRemainingPackageStages,
} from "./package-stages.mjs";

function skipJest(context) {
  context.stageResults ??= {};
  context.stageResults.jest = {
    ruleId: "stage:jest",
    stage: "jest",
    code: null,
    status: "skip",
    message: "Jest skipped because a pre-Jest stage or check failed.",
  };
}

export async function executeConventionChecks(checks, context, exemptions) {
  const selected = filterConventionChecksForExecution(checks, context, exemptions);
  context.timing?.stage?.("initial package stages");
  const initialStageResults = await executeInitialPackageStages(context);
  if (initialStageResults.some(({ status }) => status === "fail")) {
    context.validationSummary ??= {};
    context.validationSummary.checkCount = countCompletedPackageStages(context);
    skipJest(context);
    return initialStageResults;
  }

  context.validationSummary ??= {};
  context.timing?.stage?.("remaining package stages and convention checks");
  const [remainingStageResults, checkResults] = await Promise.all([
    executeRemainingPackageStages(context),
    executeConventionRules(selected, context, exemptions),
  ]);
  context.validationSummary.checkCount = selected.length + countCompletedPackageStages(context);
  const results = [...initialStageResults, ...remainingStageResults, ...checkResults];
  if (results.some(({ status }) => status === "fail")) {
    skipJest(context);
    return results;
  }
  results.push(...(await runValidationStages(context, ["jest"], context.validationStageRunners)));
  return results;
}
