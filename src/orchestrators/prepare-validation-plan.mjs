import { readConventionConfig } from "./read-convention-config.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { resolveFocusedScope } from "../cli/resolve-focused-scope.mjs";
import { selectExecutionChecks } from "./select-execution-checks.mjs";
import { collectValidationInventoryOptions } from "./collect-validation-inventory-options.mjs";
import { shouldExecuteJest } from "./should-execute-jest.mjs";

export async function prepareValidationPlan(root, ignoredRuleIds, options, dependencies) {
  const packageJson = await dependencies.loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const executeJest = shouldExecuteJest(options.executeJest, conventions.apply);
  options = { ...options, executeJest };
  const allChecks = await dependencies.discoverAllChecks();
  const checks = await dependencies.selectConventionChecks(conventions, allChecks);
  const focusedScope = resolveFocusedScope(options.jestArgs ?? []);
  const executionChecks = selectExecutionChecks(checks, focusedScope);
  const inventoryOptions = collectValidationInventoryOptions(executionChecks, options.modeRuleId);
  await dependencies.validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = dependencies.prepareValidationExemptions(
    packageJson,
    allChecks,
    ignoredRuleIds,
  );
  return {
    checks: executionChecks,
    context: createValidationContext(root, packageJson, {
      ...options,
      focusedScope,
      ...inventoryOptions,
      findRepositoryEntries: dependencies.findRepositoryEntries,
    }),
    exemptions,
  };
}
