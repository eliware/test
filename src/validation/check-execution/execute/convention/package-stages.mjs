import { runValidationStages } from "../../../stages/run-validation-stages.mjs";

const initialPackageStages = ["lint", "format", "audit", "outdated"];
const remainingPackageStages = ["pack", "typecheck", "build"];

export function executeInitialPackageStages(context, runStages = runValidationStages) {
  return runStages(context, initialPackageStages, context.validationStageRunners);
}

export function executeRemainingPackageStages(context, runStages = runValidationStages) {
  return runStages(context, remainingPackageStages, context.validationStageRunners);
}

export function countCompletedPackageStages(context) {
  return Object.values(context.stageResults ?? {}).filter(
    (result) => ["pass", "warning"].includes(result.status) && result.stage !== "jest",
  ).length;
}
