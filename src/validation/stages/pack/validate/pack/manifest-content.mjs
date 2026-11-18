import validatePackedManifestFiles from "./manifest-content/packed/files.mjs";
import validatePackManifestAllowlist from "./manifest-content/allowlist.mjs";
import validatePackManifestRequiredContent from "./manifest-content/required-content.mjs";
export default function validatePackManifestContent(packed, files) {
  const packedErrors = validatePackedManifestFiles(packed);
  if (packedErrors.shapeError) return packedErrors.shapeError;
  const allowlistErrors = validatePackManifestAllowlist(packed, files);
  if (allowlistErrors.entryError) return allowlistErrors.entryError;
  if (packedErrors.pathError) return packedErrors.pathError;
  if (allowlistErrors.coverageError) return allowlistErrors.coverageError;
  const requiredContentError = validatePackManifestRequiredContent(packed);
  return requiredContentError ?? allowlistErrors.unusedError;
}
