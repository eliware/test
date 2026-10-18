function collectTargets(value, targets, allowBarePath) {
  if (typeof value === "string") {
    if (value.startsWith("./")) targets.push(value.slice(2));
    else if (allowBarePath && !value.startsWith("#")) targets.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectTargets(entry, targets, allowBarePath));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectTargets(entry, targets, allowBarePath));
  }
  return targets;
}

const packageTargetFields = [
  ["main", true],
  ["module", true],
  ["types", true],
  ["typings", true],
  ["bin", true],
  ["exports", false],
  ["browser", true],
  ["unpkg", true],
  ["jsdelivr", true],
  ["typesVersions", true],
  ["imports", false],
];

export function validatePackedEntrypoints(packageJson, packedPaths) {
  const targets = [
    ...new Set(
      packageTargetFields.flatMap(([field, allowBarePath]) =>
        collectTargets(packageJson?.[field], [], allowBarePath),
      ),
    ),
  ];
  const missing = targets.filter((target) => !packedTargetMatches(target, packedPaths));
  return missing.length
    ? `npm pack omitted public package entrypoints: ${missing.join(", ")}.`
    : null;
}
import { packedTargetMatches } from "./target-matches.mjs";
