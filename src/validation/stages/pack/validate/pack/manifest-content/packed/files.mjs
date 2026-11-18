import validatePackedManifestShape from "./paths.mjs";
import validatePackedManifestPaths from "../packed-paths/validate-packed-manifest-paths.mjs";
export default function validatePackedManifestFiles(packed) {
  const shapeError = validatePackedManifestShape(packed);
  return {
    shapeError,
    pathError: shapeError ? null : validatePackedManifestPaths(packed),
  };
}
