export function validatePackageIdentity(packageJson) {
  if (typeof packageJson?.name !== "string" || !/^@eliware\/[^/\s]+$/.test(packageJson.name))
    return "package.json.name must be a scoped @eliware/* name.";
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(packageJson.version ?? ""))
    return "package.json.version must be a valid semantic version.";
  return null;
}
