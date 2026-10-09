import { compatibleWithNode26 } from "../../../checks/general/E-0.1.0.1.1/validate-package-runtime.mjs";
import { derivePackageFilesAllowlist } from "./derive-package-files-allowlist.mjs";
import { validateOrderedPackageFiles } from "./validate-ordered-package-files.mjs";
import { validatePackageLifecycleScripts } from "./validate-package-lifecycle-scripts.mjs";
import { readCanonicalOrder } from "../../shared/conventions/read-canonical-order.mjs";

export function validatePublicationMetadata(packageJson, { selfHosted = false } = {}) {
  if (packageJson?.private !== false) {
    return "Public npm packages must set package.json.private to false.";
  }
  if (
    typeof packageJson?.engines?.node !== "string" ||
    !compatibleWithNode26(packageJson.engines.node.trim())
  ) {
    return "Public npm packages must declare Node.js 26 compatibility.";
  }
  if (packageJson?.publishConfig?.provenance !== true) {
    return "Public npm packages must enable npm provenance.";
  }
  const files = packageJson?.files;
  if (!Array.isArray(files))
    return "Public npm packages must define package.json.files as an array.";
  const fileOrderError = validateOrderedPackageFiles(
    files,
    derivePackageFilesAllowlist(packageJson),
  );
  if (fileOrderError) return fileOrderError;
  const profiles = packageJson?.eliware?.apply ?? [];
  const environmentProfiles = readCanonicalOrder("package-files.yaml").environmentExampleProfiles;
  if (
    files.includes(".env.example") &&
    !environmentProfiles.some((profile) => profiles.includes(profile))
  )
    return "package.json.files may include .env.example only for a profile that supports runtime environment configuration.";
  const packScript = selfHosted ? "node bin/eliware-test.mjs --pack" : "eliware-test --pack";
  if (packageJson?.scripts?.pack !== packScript) {
    return "Public npm packages must define pack=eliware-test --pack.";
  }
  return validatePackageLifecycleScripts(packageJson);
}
