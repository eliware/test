import semver from "semver";
import { bundledConventionVersion } from "../../../../../validation/check-discovery/read/bundled-profile-catalog.mjs";

export function validatePackageVersion(packageJson) {
  const version = packageJson?.version;
  if (
    typeof version !== "string" ||
    !/^\d+\.\d+\.\d+$/u.test(version) ||
    semver.valid(version, { loose: false }) !== version ||
    version.split(".").slice(0, 2).join(".") !== bundledConventionVersion
  )
    return [
      `package.json.version must be numeric MAJOR.MINOR.PATCH for Convention v${bundledConventionVersion}.`,
    ];
  return [];
}
