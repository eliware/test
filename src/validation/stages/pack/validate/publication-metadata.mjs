import { compatibleWithNode26 } from "./compatible-node-range.mjs";
import { derivePackageFilesAllowlist } from "../derive-package-files-allowlist.mjs";
import { validateOrderedPackageFiles } from "./ordered-package-files.mjs";
import { validatePackageLifecycleScripts } from "./package-lifecycle-scripts.mjs";
import { validatePackScript } from "./pack-script.mjs";

export function validatePublicationMetadata(packageJson, { selfHosted = false } = {}) {
  if (packageJson?.private !== false) {
    return "Public npm packages must set package.json.private to false.";
  }
  if (
    typeof packageJson?.engines?.node !== "string" ||
    !compatibleWithNode26(packageJson.engines.node.trim())
  ) {
    return "Public npm packages must declare Node.js 26 or later compatibility.";
  }
  if (packageJson?.publishConfig?.provenance !== true) {
    return "Public npm packages must enable npm provenance.";
  }
  const files = packageJson?.files;
  if (!Array.isArray(files))
    return "Public npm packages must define package.json.files with an array.";
  const fileOrderError = validateOrderedPackageFiles(
    files,
    derivePackageFilesAllowlist(packageJson),
  );
  if (fileOrderError) return fileOrderError;
  const packScriptError = validatePackScript(packageJson, { selfHosted });
  if (packScriptError) return packScriptError;
  return validatePackageLifecycleScripts(packageJson);
}
