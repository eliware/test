import { isInScopeSource, normalizeSourcePath } from "./coverage-source-path.mjs";

export function validateDetailedCoverageFiles(json, expectedFiles = [], expectedShapes = {}) {
  const entries = Object.entries(json ?? {}).filter(([file]) => isInScopeSource(file));
  if (entries.length === 0 && expectedFiles.length === 0) return [];
  const requiredMaps = ["s", "b", "f", "statementMap", "branchMap", "fnMap"];
  for (const [file, data] of entries) {
    if (
      !data ||
      typeof data !== "object" ||
      requiredMaps.some((key) => !Object.hasOwn(data, key))
    ) {
      throw new Error(`Coverage evidence is incomplete for ${file}.`);
    }
  }
  const reported = new Set(entries.map(([file]) => normalizeSourcePath(file)));
  const omitted = expectedFiles.filter(
    (file) => isInScopeSource(file) && !reported.has(normalizeSourcePath(file)),
  );
  if (omitted.length > 0) {
    throw new Error(`Detailed coverage omits in-scope source file(s): ${omitted.join(", ")}.`);
  }
  const expected = new Set(expectedFiles.filter(isInScopeSource).map(normalizeSourcePath));
  for (const file of reported) {
    if (!expected.has(file)) {
      throw new Error(`Detailed coverage contains non-repository source file: ${file}.`);
    }
    if (!expectedShapes[file]) {
      throw new Error(`Detailed coverage has no source-derived shape for ${file}.`);
    }
  }
  return entries;
}
