export function findMirrorViolations(sourceFiles, testFiles, sourceDirectories = [], testDirectories = []) {
  const invalidSource = sourceFiles.filter((file) => /\.(?:js|cjs|mjs|ts|tsx|jsx)$/iu.test(file) && !file.endsWith(".mjs"));
  const sources = sourceFiles.filter((file) => file.endsWith(".mjs"));
  const expectedTests = new Set(sources.map((source) => source.replace(/\.mjs$/u, ".test.mjs")));
  const actualTests = new Set(testFiles.filter((file) => file.endsWith(".test.mjs")));
  const missing = [...expectedTests].filter((file) => !actualTests.has(file));
  const orphan = [...actualTests].filter((file) => !expectedTests.has(file));
  const invalidTests = testFiles.filter((file) => !file.endsWith(".test.mjs"));
  const missingDirectories = sourceDirectories.filter((directory) => !testDirectories.includes(directory));
  const orphanDirectories = testDirectories.filter((directory) => !sourceDirectories.includes(directory));
  const countMismatch = sourceFiles.length !== testFiles.length || sourceDirectories.length !== testDirectories.length;
  return [
    countMismatch ? `src/tests file or directory counts differ (src files: ${sourceFiles.length}, tests files: ${testFiles.length}, src directories: ${sourceDirectories.length}, tests directories: ${testDirectories.length})` : "",
    missing.length > 0 ? `missing mirrored tests: ${missing.join(", ")}` : "",
    orphan.length > 0 ? `orphan tests: ${orphan.join(", ")}` : "",
    missingDirectories.length > 0 ? `missing mirrored directories: ${missingDirectories.join(", ")}` : "",
    orphanDirectories.length > 0 ? `orphan test directories: ${orphanDirectories.join(", ")}` : "",
    invalidTests.length > 0 ? `invalid test paths (expected .test.mjs): ${invalidTests.join(", ")}` : "",
    invalidSource.length > 0 ? `invalid source paths (expected .mjs): ${invalidSource.join(", ")}` : "",
  ].filter(Boolean);
}
