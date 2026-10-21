import { validatePackManifestCoverage } from "./manifest-content/coverage.mjs";
import {
  validatePackManifestUnexpectedPaths,
  validatePackManifestUnusedAllowlistEntries,
} from "./manifest-content/allowlist-coverage.mjs";
import { validatePackManifestAllowlist } from "./manifest-content/paths.mjs";
import {
  validatePackedManifestPaths,
  validatePackedManifestShape,
} from "./manifest-content/packed-paths.mjs";

export function validatePackManifestContent(packed, files) {
  const shapeError = validatePackedManifestShape(packed);
  if (shapeError) return shapeError;
  const allowlistError = validatePackManifestAllowlist(files);
  if (allowlistError) return allowlistError;
  const pathError = validatePackedManifestPaths(packed);
  if (pathError) return pathError;
  const unexpectedPathError = validatePackManifestUnexpectedPaths(packed, files);
  if (unexpectedPathError) return unexpectedPathError;
  const coverageError = validatePackManifestCoverage(packed);
  return coverageError ?? validatePackManifestUnusedAllowlistEntries(packed, files);
}
