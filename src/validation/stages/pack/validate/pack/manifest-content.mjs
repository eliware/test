import validatePackManifestCoverage from "./manifest-content/coverage.mjs";
import validatePackManifestUnexpectedPaths from "./manifest-content/allowlist-coverage.mjs";
import validatePackManifestUnusedAllowlistEntries from "./manifest-content/allowlist-coverage/validate-pack-manifest-unused-allowlist-entries.mjs";
import validatePackManifestAllowlist from "./manifest-content/paths.mjs";
import validatePackedManifestPaths from "./manifest-content/packed-paths/validate-packed-manifest-paths.mjs";
import validatePackedManifestShape from "./manifest-content/packed-paths.mjs";
export default function validatePackManifestContent(packed, files) {
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
