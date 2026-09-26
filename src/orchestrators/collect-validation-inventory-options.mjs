export function collectValidationInventoryOptions(checks, modeRuleId) {
  const inventoryChecks = modeRuleId
    ? checks.filter(({ ruleId }) => ruleId === modeRuleId)
    : checks;
  return {
    expandedDirectories: [...new Set(inventoryChecks.flatMap(({ repositoryInventoryOptions }) =>
      repositoryInventoryOptions?.expandedDirectories ?? [],
    ))],
    includeTestResults: inventoryChecks.some(({ repositoryInventoryOptions }) =>
      repositoryInventoryOptions?.includeTestResults === true,
    ),
    includeTestResultsUnder: [...new Set(inventoryChecks.flatMap(({ repositoryInventoryOptions }) =>
      repositoryInventoryOptions?.includeTestResultsUnder ?? [],
    ))],
  };
}
