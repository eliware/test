import { isAllowedLibraryBarrelCoverageException } from "./barrel-exception.mjs";

const forbiddenCoverage = /\b(?:istanbul|c8|v8|coverage)\s+ignore\b|\bcoverage\s*:\s*false/iu;

export function validateProductionCoveragePolicy(path, content, options = {}) {
  if (!/^src\/.*\.mjs$/u.test(path) || !forbiddenCoverage.test(content)) return null;
  return isAllowedLibraryBarrelCoverageException(content, options)
    ? null
    : `${path} must not exclude production coverage.`;
}
