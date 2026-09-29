export function findOrphanTestViolations(testFiles, expectedTests) {
  return testFiles.filter((file) => file.endsWith(".test.mjs") && !expectedTests.has(file));
}
