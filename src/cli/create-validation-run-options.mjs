import { resolveValidationStageOptions } from "./resolve-validation-stage-options.mjs";

export function createValidationRunOptions(args, diagnosticOptions, options, timing, write) {
  return {
    ...resolveValidationStageOptions(diagnosticOptions, options),
    jestArgs: diagnosticOptions.jestArgs,
    toolArgs: diagnosticOptions.toolArgs,
    timing,
    writeOutput: args.includes("--debug-timing") ? write : undefined,
  };
}
