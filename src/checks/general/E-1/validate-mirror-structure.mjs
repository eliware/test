export function findMirrorViolations(
  sourceFiles,
  testFiles,
  sourceDirectories = [],
  testDirectories = [],
) {
  const invalidSource = sourceFiles.filter((file) => /\.(?:js|cjs|mjs|ts|tsx|jsx)$/iu.test(file) && !file.endsWith(".mjs"));
  const sources = sourceFiles.filter((file) => file.endsWith(".mjs"));
  const expectedTests = new Set(sources.map((source) => source.replace(/\.mjs$/, ".test.mjs")));
  const actualTests = new Set(testFiles.filter((file) => file.endsWith(".test.mjs")));
  const missing = [...expectedTests].filter((file) => !actualTests.has(file));
  const orphan = [...actualTests].filter((file) => !expectedTests.has(file));
  const invalid = testFiles.filter((file) => !file.endsWith(".test.mjs"));
  const missingDirectories = sourceDirectories.filter((directory) => !testDirectories.includes(directory));
  const orphanDirectories = testDirectories.filter((directory) => !sourceDirectories.includes(directory));
  const countMismatch = sourceFiles.length !== testFiles.length || sourceDirectories.length !== testDirectories.length;
  return [
    countMismatch
      ? `src/tests file or directory counts differ (src files: ${sourceFiles.length}, tests files: ${testFiles.length}, src directories: ${sourceDirectories.length}, tests directories: ${testDirectories.length})`
      : "",
    missing.length > 0 ? `missing mirrored tests: ${missing.join(", ")}` : "",
    orphan.length > 0 ? `orphan tests: ${orphan.join(", ")}` : "",
    missingDirectories.length > 0 ? `missing mirrored directories: ${missingDirectories.join(", ")}` : "",
    orphanDirectories.length > 0 ? `orphan test directories: ${orphanDirectories.join(", ")}` : "",
    invalid.length > 0 ? `invalid test paths (expected .test.mjs): ${invalid.join(", ")}` : "",
    invalidSource.length > 0 ? `invalid source paths (expected .mjs): ${invalidSource.join(", ")}` : "",
  ].filter(Boolean);
}

export function findDuplicatePathViolations(sourceFiles, testFiles) {
  const findings = [];
  for (const [label, files] of [["source", sourceFiles], ["test", testFiles]]) {
    const normalized = new Map();
    for (const file of files) {
      const key = file.toLowerCase();
      const entries = normalized.get(key) ?? [];
      entries.push(file);
      normalized.set(key, entries);
    }
    for (const entries of normalized.values()) if (entries.length > 1) findings.push(`duplicate ${label} paths differing only by case: ${entries.join(", ")}`);
  }
  return findings;
}

export function findOrphanTestViolations(testFiles, expectedTests) {
  return testFiles.filter((file) => file.endsWith(".test.mjs") && !expectedTests.has(file) && !/(?:integration|e2e|smoke|cross[-_]?cutting)/iu.test(file));
}

export function findTestContractViolations(sourceFiles, testContents) {
  const findings = [];
  for (const source of sourceFiles) {
    const test = source.replace(/\.mjs$/u, ".test.mjs");
    const content = testContents.get(test) ?? "";
    if (!/\b(?:test|it|describe)\s*\(/u.test(content)) findings.push(`${test} is not a Jest test file`);
    if (!/(?:from|import|require\s*\()[\s\S]*src[\\/]\S+\.mjs/u.test(content)) findings.push(`${test} does not reference an implementation module`);
  }
  return findings;
}
