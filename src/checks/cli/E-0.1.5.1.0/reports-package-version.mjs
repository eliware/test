export function reportsPackageVersion(output, packageVersion) {
  if (typeof packageVersion !== "string" || !packageVersion.trim()) return false;
  const versions = [
    ...output.matchAll(/(?<![\w.])v?(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)(?![\w.+-])/gu),
  ].map((match) => match[1]);
  return versions.length > 0 && versions.every((version) => version === packageVersion);
}
