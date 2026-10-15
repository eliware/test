const forbiddenCoverage = /\b(?:istanbul|c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;
const nonIstanbulCoverage = /\b(?:c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export function validateProductionCoveragePolicy(path, content, options = {}) {
  if (!/^src\/.*\.mjs$/u.test(path) || !forbiddenCoverage.test(content)) return null;
  const allowedLibraryBarrel =
    options.allowLibraryBarrel && options.pureExportBarrel && !nonIstanbulCoverage.test(content);
  return allowedLibraryBarrel ? null : `${path} must not exclude production coverage.`;
}
