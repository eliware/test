import { runValidationStages } from "../../../stages/run-validation-stages.mjs";

const packageStages = ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"];

export async function executePackageStages(context, runStages = runValidationStages) {
  const failures = await runStages(context, packageStages, context.validationStageRunners);
  const completedStages = Object.values(context.stageResults).filter(
    (result) => ["pass", "warning"].includes(result.status) && result.stage !== "jest",
  ).length;
  return { failures, completedStages };
}
