import { compatibleWithNode26 } from "../../../checks/general/E-0.1.0.1.1/validate-package-runtime.mjs";
import { derivePackageFilesAllowlist } from "./derive-package-files-allowlist.mjs";
import { validatePackageLifecycleScripts } from "./validate-package-lifecycle-scripts.mjs";

export function validatePublicationMetadata(packageJson, { selfHosted = false } = {}) {
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
  const expectedFiles = derivePackageFilesAllowlist(packageJson);
  // Exact equality to the derived canonical entries also enforces uniqueness and safe known paths.
  if (!Array.isArray(files) || JSON.stringify(files) !== JSON.stringify(expectedFiles))
    return `Public npm packages must use the profile-derived package.json.files allowlist: ${expectedFiles.join(", ")}.`;
  const profiles = packageJson?.eliware?.apply ?? [];
  if (
    files.includes(".env.example") &&
    !["application", "library", "web", "discord", "mcp-server"].some((profile) =>
      profiles.includes(profile),
    )
  )
    return "package.json.files may include .env.example only for a profile that supports runtime environment configuration.";
  const packScript = selfHosted ? "node bin/eliware-test.mjs --pack" : "eliware-test --pack";
  if (packageJson?.scripts?.pack !== packScript) {
    return "Public npm packages must define pack=eliware-test --pack.";
  }
  return validatePackageLifecycleScripts(packageJson);
}
