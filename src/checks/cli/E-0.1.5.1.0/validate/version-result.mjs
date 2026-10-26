import { reportsPackageVersion } from "../reports-package-version.mjs";

export function validateCliVersionResult(entrypoint, output, packageVersion) {
  return reportsPackageVersion(output, packageVersion)
    ? []
    : [`CLI entrypoint ${entrypoint} --version must report package version ${packageVersion}.`];
}
