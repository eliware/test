import { validateJestSettings } from "./settings.mjs";
import { validateJestCoverageThreshold } from "./coverage-threshold.mjs";

export function validateJestConfiguration(packageJson) {
  const jest = packageJson.jest;
  if (!jest || typeof jest !== "object" || Array.isArray(jest))
    return ["package.json must define Jest configuration."];
  return [...validateJestSettings(jest), ...validateJestCoverageThreshold(jest.coverageThreshold)];
}
