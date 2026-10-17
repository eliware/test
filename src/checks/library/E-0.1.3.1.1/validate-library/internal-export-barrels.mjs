import { validateInternalExportBarrels } from "../../../shared/validate-internal-export-barrels.mjs";

export function validateLibraryInternalExportBarrels(files, readText, packageJson, root) {
  return validateInternalExportBarrels(files, readText, packageJson, root, { library: true });
}
