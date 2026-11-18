import validatePackageScripts from "./scripts.mjs";
import validatePackageScriptFileLocations from "../../../../shared/package-scripts/validate/package-script-file-locations.mjs";

export default function validatePackageScriptPolicy(packageJson) {
  return [
    ...validatePackageScripts(packageJson),
    ...validatePackageScriptFileLocations(packageJson),
  ];
}
