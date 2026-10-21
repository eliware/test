import { validatePackManifestCoverage } from "./manifest-content/coverage.mjs";
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
  return pathError ?? validatePackManifestCoverage(packed, files);
}
