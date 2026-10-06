import { createRepositoryInventory } from "../orchestration/create-repository-inventory.mjs";

export function createValidationContext(root, packageJson, options = {}) {
  const repositoryInventory =
    options.repositoryInventory ??
    createRepositoryInventory(root, {
      focusedScope: options.focusedScope,
      findEntries: options.findRepositoryEntries,
      expandedDirectories: options.expandedDirectories,
      includeTestResults: options.includeTestResults,
      includeTestResultsUnder: options.includeTestResultsUnder,
    });
  return {
    root,
    packageJson,
    ...(options.env ? { env: options.env } : {}),
    executeJest: options.executeJest === true,
    executeLint: options.executeLint === true,
    executeAudit: options.executeAudit === true,
    executePack: options.executePack === true,
    executePackageChecks: options.executePackageChecks === true,
    executeFormat: options.executeFormat === true,
    mode: options.mode ?? null,
    modeRuleId: options.modeRuleId ?? null,
    jestArgs: options.jestArgs ?? [],
    toolArgs: options.toolArgs ?? [],
    timing: options.timing,
    writeOutput: options.writeOutput,
    repositoryInventory,
    parseAst: options.parseAst ?? repositoryInventory.parseAst,
    ...(options.repositoryFiles ? { repositoryFiles: options.repositoryFiles } : {}),
    ...(options.focusedScope ? { focusedScope: options.focusedScope } : {}),
  };
}
