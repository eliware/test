import { validatePackagePublicationMetadata } from "./validate-package-publication-metadata.mjs";
import { validatePackageExemptions } from "./validate-package-exemptions.mjs";
import { validatePackageModuleType } from "./validate-package-module-type.mjs";
import { validatePackageScripts } from "./validate-package-scripts.mjs";

export function validateEliwarePackageMetadata(packageJson) {
  const findings = [
    validatePackageModuleType(packageJson),
    validatePackageScripts(packageJson),
    validatePackagePublicationMetadata(packageJson),
    validatePackageExemptions(packageJson?.eliware?.exempt),
  ].filter(Boolean);
  return findings.length ? findings.join("\n") : null;
}
