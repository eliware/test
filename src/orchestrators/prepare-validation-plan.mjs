import { readConventionConfig } from "./read-convention-config.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { resolveFocusedScope } from "../cli/resolve-focused-scope.mjs";

const focusedRuleIds = new Set([
  "E-1.4", "E-1.17", "E-1.20", "E-1.20.1", "E-1.20.7", "E-1.20.10", "E-1.20.17", "E-1.20.20",
]);

export async function prepareValidationPlan(root, ignoredRuleIds, options, dependencies) {
  const packageJson = await dependencies.loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const allChecks = await dependencies.discoverAllChecks();
  const checks = await dependencies.selectConventionChecks(conventions, allChecks);
  const focusedScope = resolveFocusedScope(options.jestArgs ?? []);
  const executionChecks = focusedScope ? checks.filter(({ ruleId }) => focusedRuleIds.has(ruleId)) : checks;
  await dependencies.validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = dependencies.prepareValidationExemptions(packageJson, allChecks, ignoredRuleIds);
  return {
    checks: executionChecks,
    context: createValidationContext(root, packageJson, { ...options, focusedScope }),
    exemptions,
  };
}
