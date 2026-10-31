const requiredKeys = [
  "collectCoverageFrom",
  "coverageReporters",
  "coverageThreshold",
  "testEnvironment",
  "testMatch",
];

export function validateJestSettings(jest) {
  const errors = [];
  if (JSON.stringify(Object.keys(jest).sort()) !== JSON.stringify(requiredKeys))
    errors.push("package.json Jest settings must use only the required configuration keys.");
  if (jest.testEnvironment !== "node") errors.push('Jest testEnvironment must be "node".');
  if (!sameArray(jest.testMatch, ["**/tests/**/*.test.mjs"]))
    errors.push('Jest testMatch must be ["**/tests/**/*.test.mjs"].');
  if (!sameArray(jest.collectCoverageFrom, ["src/**/*.mjs"]))
    errors.push('Jest collectCoverageFrom must be ["src/**/*.mjs"].');
  if (!sameArray(jest.coverageReporters, ["text", "json-summary"]))
    errors.push('Jest coverageReporters must be ["text", "json-summary"].');
  return errors;
}

function sameArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}
