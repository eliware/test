import { readConventionConfig } from "./read-convention-config.mjs";
import { selectConventionChecks } from "./select-convention-checks.mjs";
import { loadValidationTarget } from "./load-validation-target.mjs";
import { prepareValidationExemptions } from "./prepare-validation-exemptions.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { executeValidationPlan } from "./execute-validation-plan.mjs";
import { discoverAllChecks } from "./discover-checks.mjs";
import { validateBundledDirectiveCompleteness } from "./validate-bundled-directive-completeness.mjs";

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
  const packageJson = await loadTarget(root);
  const conventions = readConventionConfig(packageJson);
  const allChecks = await discoverChecks();
  const checks = await selectChecks(conventions, allChecks);
  await validateCompleteness(allChecks, conventions.apply);
  const exemptions = prepareExemptions(packageJson, allChecks, ignoredRuleIds);
  const context = createValidationContext(root, packageJson, options);
  return executePlan(checks, context, exemptions);
}
