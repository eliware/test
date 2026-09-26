import { validatePackagePublicationMetadata } from "./validate-package-publication-metadata.mjs";
import { validatePackageExemptions } from "./validate-package-exemptions.mjs";

export function validateEliwarePackageMetadata(packageJson) {
  if (packageJson?.type !== "module") return "package.json.type must be module.";
  if (!packageJson?.scripts || typeof packageJson.scripts !== "object" || Array.isArray(packageJson.scripts) || Object.keys(packageJson.scripts).length === 0 || Object.values(packageJson.scripts).some((script) => typeof script !== "string" || !script.trim())) return "package.json.scripts must be a nonempty object of nonempty strings.";
  return validatePackagePublicationMetadata(packageJson)
    ?? validatePackageExemptions(packageJson?.eliware?.exempt);
}
