export function createValidationRunOptions(args, diagnosticOptions, options, timing, write) {
  const modeRuleIds = {
    lint: "E-1.4",
    format: "E-1.20.17",
    "format-check": "E-1.20.17",
    audit: "E-1.20.19",
    pack: "E-1.140.1",
  };
  return {
    executeJest: options.executeJest !== false && diagnosticOptions.mode === null,
    executeLint: options.executeLint ?? options.executeJest ?? true,
    executeAudit: options.executeAudit ?? options.executeJest ?? true,
    executePack: options.executePack ?? options.executeJest ?? true,
    executePackageChecks: options.executePackageChecks ?? true,
    executeFormat: options.executeFormat ?? options.executeJest ?? true,
    mode: diagnosticOptions.mode,
    modeRuleId: modeRuleIds[diagnosticOptions.mode] ?? null,
    jestArgs: diagnosticOptions.jestArgs,
    toolArgs: diagnosticOptions.toolArgs,
    timing,
    writeOutput: args.includes("--debug-timing") ? write : undefined,
  };
}
