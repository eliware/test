import validatePackManifestCoverage from "./coverage.mjs";
export default function validatePackManifestRequiredContent(packed) {
  return validatePackManifestCoverage(packed);
}
