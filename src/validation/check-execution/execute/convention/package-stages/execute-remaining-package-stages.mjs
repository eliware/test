import runValidationStages from "../../../../stages/run-validation-stages.mjs";
const remainingPackageStages = ["pack", "typecheck", "build"];
function executeRemainingPackageStages(context, runStages = runValidationStages) {
  return runStages(context, remainingPackageStages, context.validationStageRunners);
}
export default executeRemainingPackageStages;
