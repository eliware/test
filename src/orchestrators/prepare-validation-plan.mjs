import { readConventionConfig } from "./read-convention-config.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { resolveFocusedScope } from "../cli/resolve-focused-scope.mjs";

export async function prepareValidationPlan(root, ignoredRuleIds, options, dependencies) {
  const packageJson = await dependencies.loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const allChecks = await dependencies.discoverAllChecks();
  const checks = await dependencies.selectConventionChecks(conventions, allChecks);
  const focusedScope = resolveFocusedScope(options.jestArgs ?? []);
  const executionChecks = focusedScope ? checks.filter(({ focusedSafe }) => focusedSafe === true) : checks;
  await dependencies.validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = dependencies.prepareValidationExemptions(packageJson, allChecks, ignoredRuleIds);
  return {
    checks: executionChecks,
    context: createValidationContext(root, packageJson, { ...options, focusedScope }),
    exemptions,
  };
}
