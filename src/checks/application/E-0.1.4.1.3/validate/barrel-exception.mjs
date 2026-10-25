const nonIstanbulCoverage = /\b(?:c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export function isAllowedLibraryBarrelCoverageException(content, options = {}) {
  return Boolean(
    options.allowLibraryBarrel && options.pureExportBarrel && !nonIstanbulCoverage.test(content),
  );
}
