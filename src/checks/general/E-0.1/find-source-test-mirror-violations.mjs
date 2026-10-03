export function findMirrorViolations(
  sourceFiles,
  testFiles,
  sourceDirectories = [],
  testDirectories = [],
  { allowTypeDeclarations = false } = {},
) {
  const declarationFiles = allowTypeDeclarations
    ? sourceFiles.filter((file) => file.endsWith(".d.ts"))
    : [];
  const sourceFileSet = new Set(sourceFiles);
  const sourceComparisonUnits = new Set(
    sourceFiles.map((file) => file.replace(/\.d\.ts$/u, ".mjs")),
  );
  const unpairedDeclarations = declarationFiles.filter(
    (file) => !sourceFileSet.has(file.replace(/\.d\.ts$/u, ".mjs")),
  );
  const invalidSource = sourceFiles.filter((file) => {
    if (declarationFiles.includes(file)) return false;
    return /\.(?:js|cjs|mjs|ts|tsx|jsx)$/iu.test(file) && !file.endsWith(".mjs");
  });
  const sources = sourceFiles.filter((file) => file.endsWith(".mjs"));
  const expectedTests = new Set(sources.map((source) => source.replace(/\.mjs$/u, ".test.mjs")));
  const actualTests = new Set(testFiles.filter((file) => file.endsWith(".test.mjs")));
  const missing = [...expectedTests].filter((file) => !actualTests.has(file));
  const orphan = [...actualTests].filter((file) => !expectedTests.has(file));
  const invalidTests = testFiles.filter((file) => !file.endsWith(".test.mjs"));
  const missingDirectories = sourceDirectories.filter(
    (directory) => !testDirectories.includes(directory),
  );
  const orphanDirectories = testDirectories.filter(
    (directory) => !sourceDirectories.includes(directory),
  );
  const countMismatch =
    sourceComparisonUnits.size !== testFiles.length ||
    sourceDirectories.length !== testDirectories.length;
  return [
    countMismatch
      ? `src/tests file or directory counts differ (src comparison units: ${sourceComparisonUnits.size}, tests files: ${testFiles.length}, src directories: ${sourceDirectories.length}, tests directories: ${testDirectories.length})`
      : "",
    missing.length > 0 ? `missing mirrored tests: ${missing.join(", ")}` : "",
    orphan.length > 0 ? `orphan tests: ${orphan.join(", ")}` : "",
    unpairedDeclarations.length > 0
      ? `unpaired TypeScript declarations (expected an adjacent matching .mjs): ${unpairedDeclarations.join(", ")}`
      : "",
    missingDirectories.length > 0
      ? `missing mirrored directories: ${missingDirectories.join(", ")}`
      : "",
    orphanDirectories.length > 0 ? `orphan test directories: ${orphanDirectories.join(", ")}` : "",
    invalidTests.length > 0
      ? `invalid test paths (expected .test.mjs): ${invalidTests.join(", ")}`
      : "",
    invalidSource.length > 0
      ? `invalid source paths (expected .mjs): ${invalidSource.join(", ")}`
      : "",
  ].filter(Boolean);
}
