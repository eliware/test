import { resolveValidationStageOptions } from "./resolve-validation-stage-options.mjs";
import { resolveFocusedScope } from "./resolve-focused-scope.mjs";

export function createValidationRunOptions(args, diagnosticOptions, options, timing, write) {
  const focusedScope = resolveFocusedScope(diagnosticOptions.jestArgs);
  return {
    ...resolveValidationStageOptions(diagnosticOptions, options),
    jestArgs: diagnosticOptions.jestArgs,
    toolArgs: focusedScope ? [] : diagnosticOptions.toolArgs,
    timing,
    writeOutput: args.includes("--debug-timing") ? write : undefined,
    ...(focusedScope ? { focusedScope } : {}),
  };
}
