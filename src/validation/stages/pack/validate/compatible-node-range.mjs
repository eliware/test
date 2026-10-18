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
