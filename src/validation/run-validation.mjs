import { executeValidationPlan } from "./check-execution/execute-validation-plan.mjs";
import { selectConventionChecks } from "./check-discovery/select-convention-checks.mjs";
import { loadValidationTarget } from "./planning/load-validation-target.mjs";
import { prepareValidationExemptions } from "./planning/prepare-validation-exemptions.mjs";
import { discoverAllChecks } from "./check-discovery/discover-checks.mjs";
import { validateBundledDirectiveCompleteness } from "./planning/validate-bundled-directive-completeness.mjs";
import { prepareValidationPlan } from "./planning/prepare-validation-plan.mjs";
import { findRepositoryEntries } from "./shared/repository/find-repository-files.mjs";
import { finalizeValidationRun } from "./check-execution/finalize-validation-run.mjs";

export const validationDependencies = Object.freeze({
  loadValidationTarget,
  selectConventionChecks,
  discoverAllChecks,
  validateBundledDirectiveCompleteness,
  prepareValidationExemptions,
  executeValidationPlan,
  findRepositoryEntries,
});

export function resolveValidationDependencies(dependencies = validationDependencies) {
  return dependencies;
}

export async function runValidation(root, ignoredRuleIds, options = {}) {
  const dependencies = resolveValidationDependencies(options.dependencies);
  const {
    loadValidationTarget: loadTarget,
    selectConventionChecks: selectChecks,
    discoverAllChecks: discoverChecks,
    validateBundledDirectiveCompleteness: validateCompleteness,
    prepareValidationExemptions: prepareExemptions,
    findRepositoryEntries: findFiles,
    executeValidationPlan: executePlan,
  } = dependencies;
  const plan = await prepareValidationPlan(root, ignoredRuleIds, options, {
    loadValidationTarget: loadTarget,
    selectConventionChecks: selectChecks,
    discoverAllChecks: discoverChecks,
    validateBundledDirectiveCompleteness: validateCompleteness,
    prepareValidationExemptions: prepareExemptions,
    findRepositoryEntries: findFiles,
  });
  let result;
  let planFailure;
  try {
    result = await executePlan(plan.checks, plan.context, plan.exemptions);
  } catch (error) {
    planFailure = { error };
  }
  return finalizeValidationRun({
    result,
    planFailure,
    context: plan.context,
    removeCoverage: options.removeCoverage,
  });
}
