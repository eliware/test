const forbiddenCoverage = /\b(?:istanbul|c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export function validateProductionCoveragePolicy(path, content) {
  return path.startsWith("src/") && forbiddenCoverage.test(content)
    ? `${path} must not exclude production coverage.`
    : null;
}
