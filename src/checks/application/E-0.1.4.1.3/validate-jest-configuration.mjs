export function validateJestConfiguration(packageJson) {
  const jest = packageJson.jest;
  if (!jest || typeof jest !== "object" || Array.isArray(jest))
    return ["package.json must define Jest configuration."];
  const errors = [];
  const requiredKeys = [
    "collectCoverageFrom",
    "coverageReporters",
    "coverageThreshold",
    "testEnvironment",
    "testMatch",
  ];
  if (JSON.stringify(Object.keys(jest).sort()) !== JSON.stringify(requiredKeys))
    errors.push("package.json Jest settings must use only the required configuration keys.");
  if (jest.testEnvironment !== "node") errors.push('Jest testEnvironment must be "node".');
  if (!sameArray(jest.testMatch, ["**/tests/**/*.test.mjs"]))
    errors.push('Jest testMatch must be ["**/tests/**/*.test.mjs"].');
  if (!sameArray(jest.collectCoverageFrom, ["src/**/*.mjs"]))
    errors.push('Jest collectCoverageFrom must be ["src/**/*.mjs"].');
  if (!sameArray(jest.coverageReporters, ["text", "json-summary"]))
    errors.push('Jest coverageReporters must be ["text", "json-summary"].');
  const threshold = jest.coverageThreshold?.global;
  if (JSON.stringify(Object.keys(jest.coverageThreshold ?? {}).sort()) !== '["global"]')
    errors.push("Jest coverageThreshold must define only global coverage.");
  const metrics = ["branches", "functions", "lines", "statements"];
  if (JSON.stringify(Object.keys(threshold ?? {}).sort()) !== JSON.stringify(metrics))
    errors.push("Jest global coverage must define only the four required metrics.");
  for (const metric of metrics)
    if (threshold?.[metric] !== 100)
      errors.push(`Jest global ${metric} coverage must be 100 percent.`);
  return errors;
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}
