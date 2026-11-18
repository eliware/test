import validatePackManifestUnexpectedPaths from "./allowlist-coverage.mjs";
import validatePackManifestUnusedAllowlistEntries from "./allowlist-coverage/validate-pack-manifest-unused-allowlist-entries.mjs";
import validatePackManifestEntries from "./paths.mjs";
export default function validatePackManifestAllowlist(packed, files) {
  const entryError = validatePackManifestEntries(files);
  if (entryError) return { entryError };
  return {
    entryError: null,
    coverageError: validatePackManifestUnexpectedPaths(packed, files),
    unusedError: validatePackManifestUnusedAllowlistEntries(packed, files),
  };
}
