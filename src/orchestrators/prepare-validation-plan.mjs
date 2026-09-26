import { readConventionConfig } from "./read-convention-config.mjs";
import { createValidationContext } from "./create-validation-context.mjs";
import { resolveFocusedScope } from "../cli/resolve-focused-scope.mjs";

export async function prepareValidationPlan(root, ignoredRuleIds, options, dependencies) {
  const packageJson = await dependencies.loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const executeJest =
    options.executeJest !== false &&
    conventions.apply.some((profile) => profile === "application" || profile === "library");
  options = { ...options, executeJest };
  const allChecks = await dependencies.discoverAllChecks();
  const checks = await dependencies.selectConventionChecks(conventions, allChecks);
  const focusedScope = resolveFocusedScope(options.jestArgs ?? []);
  const executionChecks = focusedScope ? checks.filter(({ focusedSafe }) => focusedSafe === true) : checks;
  const inventoryChecks = options.modeRuleId
    ? executionChecks.filter(({ ruleId }) => ruleId === options.modeRuleId)
    : executionChecks;
  const expandedDirectories = [
    ...new Set(
      inventoryChecks.flatMap(({ repositoryInventoryOptions }) =>
        repositoryInventoryOptions?.expandedDirectories ?? [],
      ),
    ),
  ];
  const includeTestResults = inventoryChecks.some(
    ({ repositoryInventoryOptions }) => repositoryInventoryOptions?.includeTestResults === true,
  );
  const includeTestResultsUnder = [
    ...new Set(
      inventoryChecks.flatMap(({ repositoryInventoryOptions }) =>
        repositoryInventoryOptions?.includeTestResultsUnder ?? [],
      ),
    ),
  ];
  await dependencies.validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = dependencies.prepareValidationExemptions(packageJson, allChecks, ignoredRuleIds);
  return {
    checks: executionChecks,
    context: createValidationContext(root, packageJson, {
      ...options,
      focusedScope,
      expandedDirectories,
      includeTestResults,
      includeTestResultsUnder,
      findRepositoryEntries: dependencies.findRepositoryEntries,
    }),
    exemptions,
  };
}
