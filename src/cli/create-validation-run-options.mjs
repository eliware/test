export function createValidationRunOptions(args, diagnosticOptions, options, timing, write) {
  return {
    executeJest: options.executeJest !== false && diagnosticOptions.mode === null,
    executeLint: options.executeLint ?? options.executeJest ?? true,
    executeAudit: options.executeAudit ?? options.executeJest ?? true,
    executePack: options.executePack ?? options.executeJest ?? true,
    executePackageChecks: options.executePackageChecks ?? options.executeJest ?? true,
    executeFormat: options.executeFormat ?? options.executeJest ?? true,
    mode: diagnosticOptions.mode,
    jestArgs: diagnosticOptions.jestArgs,
    timing,
    writeOutput: args.includes("--debug-timing") ? write : undefined,
  };
}
