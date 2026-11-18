export default function formatValidationSummary(title, result, startedAt) {
  const totalMs = Date.now() - startedAt;
  const jestMs = result.validationSummary?.jestTimeMs ?? 0;
  const checkCount = result.validationSummary?.checkCount ?? 0;
  const counts = result.validationSummary?.jestCounts ?? {
    testSuites: 0,
    tests: 0,
  };
  return [
    title,
    `Checks: ${checkCount} | Test suites: ${counts.testSuites} | Tests: ${counts.tests}`,
    "Lint warnings: 0 | Format issues: 0 | Audit issues: 0 | Pack issues: 0",
    `Checks time: ${seconds(totalMs - jestMs)}s | Jest time: ${seconds(jestMs)}s | Total time: ${seconds(totalMs)}s`,
    "Exit-code: 0",
  ].join("\n");
}

function seconds(milliseconds) {
  return Math.max(0, milliseconds / 1000).toFixed(3);
}
