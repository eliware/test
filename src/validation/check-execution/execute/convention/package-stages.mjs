import runValidationStages from "../../../stages/run-validation-stages.mjs";
const initialPackageStages = ["lint", "format", "audit", "outdated"];
export default function executeInitialPackageStages(context, runStages = runValidationStages) {
  return runStages(context, initialPackageStages, context.validationStageRunners);
}
