export function findOrphanTestViolations(testFiles, expectedTests) {
  return testFiles.filter((file) => file.endsWith(".test.mjs") && !expectedTests.has(file) && !/(?:integration|e2e|smoke|cross[-_]?cutting)/iu.test(file));
}
