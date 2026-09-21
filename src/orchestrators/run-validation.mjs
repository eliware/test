import { executeValidationPlan } from "./execute-validation-plan.mjs";
import { selectConventionChecks } from "./select-convention-checks.mjs";
import { loadValidationTarget } from "./load-validation-target.mjs";
import { prepareValidationExemptions } from "./prepare-validation-exemptions.mjs";
import { discoverAllChecks } from "./discover-checks.mjs";
import { validateBundledDirectiveCompleteness } from "./validate-bundled-directive-completeness.mjs";
import { prepareValidationPlan } from "./prepare-validation-plan.mjs";

export const validationDependencies = Object.freeze({
  loadValidationTarget,
  selectConventionChecks,
  discoverAllChecks,
  validateBundledDirectiveCompleteness,
  prepareValidationExemptions,
  executeValidationPlan,
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
    executeValidationPlan: executePlan,
  } = dependencies;
  const plan = await prepareValidationPlan(root, ignoredRuleIds, options, {
    loadValidationTarget: loadTarget,
    selectConventionChecks: selectChecks,
    discoverAllChecks: discoverChecks,
    validateBundledDirectiveCompleteness: validateCompleteness,
    prepareValidationExemptions: prepareExemptions,
  });
  return executePlan(plan.checks, plan.context, plan.exemptions);
}
