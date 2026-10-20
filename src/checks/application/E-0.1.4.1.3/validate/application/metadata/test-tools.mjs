import { isAlternativeTestOrCoverageTool } from "./is-alternative-test-or-coverage-tool.mjs";
import { validateRunnerConfiguration } from "./runner-configuration.mjs";

export function validateApplicationTestTools(packageJson = {}) {
  const harness = packageJson.name === "@eliware/test";
  const allowedHarnessTools = new Set(["@jest/globals", "jest", "istanbul-lib-instrument"]);
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const dependencies = sections.flatMap((section) => Object.entries(packageJson[section] ?? {}));
  const direct = dependencies
    .filter(
      ([name, version]) =>
        isAlternativeTestOrCoverageTool(name, version) &&
        !(harness && allowedHarnessTools.has(name)),
    )
    .map(([name]) => name);
  const errors = direct.length
    ? [`Do not declare separate test or coverage tools: ${direct.join(", ")}.`]
    : [];
  errors.push(...validateRunnerConfiguration(packageJson));
  return errors;
}
