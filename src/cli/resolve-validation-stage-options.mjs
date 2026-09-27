import { parseFocusedArguments } from "./parse-focused-arguments.mjs";

const modeRuleIds = Object.freeze({
  lint: "E-0.1.4",
  format: "E-0.1.20.17",
  "format-check": "E-0.1.20.17",
  audit: "E-0.1.20.19",
  pack: "E-0.1.140.1",
});

export function resolveValidationStageOptions(diagnosticOptions, options) {
  const focused = parseFocusedArguments(diagnosticOptions.jestArgs ?? []).positional.length > 0;
  return {
    executeJest: options.executeJest !== false && diagnosticOptions.mode === null,
    executeLint:
      diagnosticOptions.mode === "lint" ||
      (focused ? true : (options.executeLint ?? options.executeJest ?? true)),
    executeAudit:
      !focused &&
      (diagnosticOptions.mode === "audit" || (options.executeAudit ?? options.executeJest ?? true)),
    executePack:
      !focused &&
      (diagnosticOptions.mode === "pack" || (options.executePack ?? options.executeJest ?? true)),
    executePackageChecks: focused ? false : (options.executePackageChecks ?? true),
    executeFormat:
      diagnosticOptions.mode === "format" ||
      diagnosticOptions.mode === "format-check" ||
      (focused ? true : (options.executeFormat ?? options.executeJest ?? true)),
    mode: diagnosticOptions.mode,
    modeRuleId: modeRuleIds[diagnosticOptions.mode] ?? null,
  };
}
