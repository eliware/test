import { parseFocusedArguments } from "./parse-focused-arguments.mjs";

const modeRuleIds = Object.freeze({
  lint: "E-1.4",
  format: "E-1.20.17",
  "format-check": "E-1.20.17",
  audit: "E-1.20.19",
  pack: "E-1.140.1",
});

export function resolveValidationStageOptions(diagnosticOptions, options) {
  const focused = parseFocusedArguments(diagnosticOptions.jestArgs ?? []).positional.length > 0;
  return {
    executeJest: options.executeJest !== false && diagnosticOptions.mode === null,
    executeLint: focused ? false : options.executeLint ?? options.executeJest ?? true,
    executeAudit: focused ? false : options.executeAudit ?? options.executeJest ?? true,
    executePack: focused ? false : options.executePack ?? options.executeJest ?? true,
    executePackageChecks: focused ? false : options.executePackageChecks ?? true,
    executeFormat: focused ? false : options.executeFormat ?? options.executeJest ?? true,
    mode: diagnosticOptions.mode,
    modeRuleId: modeRuleIds[diagnosticOptions.mode] ?? null,
  };
}
