import semver from "semver";

const node26Range = ">=26.0.0 <27.0.0";

export function compatibleWithNode26(range) {
  return (
    typeof range === "string" &&
    semver.validRange(range) !== null &&
    semver.subset(range, node26Range)
  );
}

export function validatePackageRuntime(packageJson) {
  if (
    typeof packageJson.engines?.node !== "string" ||
    !compatibleWithNode26(packageJson.engines.node.trim())
  )
    return "package.json.engines.node must be compatible with Node.js 26.";
  if (!packageJson.jest || typeof packageJson.jest !== "object" || Array.isArray(packageJson.jest))
    return "package.json must contain Jest configuration.";
  return null;
}
