import { validatePackManifestCoverage } from "./manifest-content/coverage.mjs";
import { validatePackManifestPaths } from "./manifest-content/paths.mjs";

export function validatePackManifestContent(packed, files) {
  const pathError = validatePackManifestPaths(packed, files);
  return pathError ?? validatePackManifestCoverage(packed, files);
}
