import { readConventionConfig } from "./read-convention-config.mjs";
import { selectConventionChecks } from "./select-convention-checks.mjs";
import { loadValidationTarget } from "./load-validation-target.mjs";
import { prepareValidationExemptions } from "./prepare-validation-exemptions.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { executeValidationPlan } from "./execute-validation-plan.mjs";
import { discoverAllChecks } from "./discover-checks.mjs";
import { validateBundledDirectiveCompleteness } from "./validate-bundled-directive-completeness.mjs";

export async function runValidation(root, ignoredRuleIds = [], options = {}) {
  const packageJson = await loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const checks = await selectConventionChecks(conventions);
  const allChecks = await discoverAllChecks();
  await validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = prepareValidationExemptions(packageJson, allChecks, ignoredRuleIds);
  const context = createValidationContext(root, packageJson, options);
  return executeValidationPlan(checks, context, exemptions);
}
