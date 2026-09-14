import { readConventionConfig } from "./read-convention-config.mjs";
import { selectConventionChecks } from "./select-convention-checks.mjs";
import { loadValidationTarget } from "./load-validation-target.mjs";
import { prepareValidationExemptions } from "./prepare-validation-exemptions.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { executeValidationPlan } from "./execute-validation-plan.mjs";

export async function runValidation(root, ignoredRuleIds = [], options = {}) {
  const packageJson = await loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const checks = await selectConventionChecks(conventions);
  const exemptions = prepareValidationExemptions(packageJson, checks, ignoredRuleIds);
  const context = createValidationContext(root, packageJson, options);
  return executeValidationPlan(checks, context, exemptions);
}
