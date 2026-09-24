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
