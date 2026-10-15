import semver from "semver";

const node26Range = ">=26.0.0 <27.0.0";

export function compatibleWithNode26(range) {
  return (
    typeof range === "string" &&
    semver.validRange(range) !== null &&
    semver.subset(range, ">=26.0.0") &&
    semver.intersects(range, node26Range)
  );
}

export function validatePackageRuntime(packageJson) {
  if (packageJson?.engines?.node !== ">=26")
    return 'package.json.engines.node must be ">=26" for Node.js 26 or later.';
  if (!packageJson.jest || typeof packageJson.jest !== "object" || Array.isArray(packageJson.jest))
    return "package.json must contain Jest configuration.";
  return null;
}
