import { validatePackagePublicationMetadata } from "./validate-package-publication-metadata.mjs";
import { validatePackageExemptions } from "./validate-package-exemptions.mjs";
import { validatePackageModuleType } from "./validate-package-module-type.mjs";
import { validatePackageScripts } from "./validate-package-scripts.mjs";

export function validateEliwarePackageMetadata(packageJson) {
  const moduleTypeError = validatePackageModuleType(packageJson);
  if (moduleTypeError) return moduleTypeError;
  const scriptsError = validatePackageScripts(packageJson);
  if (scriptsError) return scriptsError;
  return (
    validatePackagePublicationMetadata(packageJson) ??
    validatePackageExemptions(packageJson?.eliware?.exempt)
  );
}
