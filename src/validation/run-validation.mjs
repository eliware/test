import executeValidationPlan from "./check-execution/execute/validation-plan.mjs";
import selectConventionChecks from "./check-discovery/select-convention-checks.mjs";
import loadValidationTarget from "./planning/load-validation-target.mjs";
import prepareValidationExemptions from "./planning/prepare-validation/exemptions.mjs";
import discoverAllChecks from "./check-discovery/discover/checks/discover-all-checks.mjs";
import validateBundledDirectiveCompleteness from "./planning/validate/bundled-directive-completeness.mjs";
import findRepositoryEntries from "./shared/repository/find-repository-files.mjs";
import readProfileCombinationPolicy from "./planning/read/profile-combination-policy.mjs";
export const validationDependencies = Object.freeze({
  loadValidationTarget,
  readProfileCombinationPolicy,
  selectConventionChecks,
  discoverAllChecks,
  validateBundledDirectiveCompleteness,
  prepareValidationExemptions,
  executeValidationPlan,
  findRepositoryEntries,
});
export default function resolveValidationDependencies(dependencies = validationDependencies) {
  return dependencies;
}
