export function createValidationContext(root, packageJson, options = {}) {
  return {
    root,
    packageJson,
    executeJest: options.executeJest === true,
    executeLint: options.executeLint === true,
    executeAudit: options.executeAudit === true,
    executePack: options.executePack === true,
    executePackageChecks: options.executePackageChecks === true,
    executeFormat: options.executeFormat === true,
    mode: options.mode ?? null,
    modeRuleId: options.modeRuleId ?? null,
    jestArgs: options.jestArgs ?? [],
    timing: options.timing,
    writeOutput: options.writeOutput,
  };
}
