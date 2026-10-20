const runnerConfigurationFields = [
  "ava",
  "@bcoe/v8-coverage",
  "c8",
  "cypress",
  "jasmine",
  "nightwatch",
  "protractor",
  "karma",
  "mocha",
  "nyc",
  "playwright",
  "qunit",
  "tap",
  "tape",
  "uvu",
  "vitest",
  "webdriverio",
  "testcafe",
  "istanbul",
  "coverage",
  "nodeTestRunner",
  "testRunner",
  "test-runner",
];

export function validateRunnerConfiguration(packageJson = {}) {
  return runnerConfigurationFields.some((field) => packageJson[field] !== undefined)
    ? ["package.json must not configure a separate test runner or coverage engine."]
    : [];
}
