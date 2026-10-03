import semver from "semver";

export function validatePackageIdentity(packageJson) {
  if (typeof packageJson?.name !== "string" || !/^@eliware\/[^/\s]+$/.test(packageJson.name))
    return "package.json.name must be a scoped @eliware/* name.";
  if (semver.valid(packageJson.version) !== packageJson.version)
    return "package.json.version must be a valid semantic version.";
  return null;
}
