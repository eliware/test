import { collectNestedStringValues } from "../../../../shared/package/collect-nested-string-values.mjs";
import { packedTargetMatches } from "./target-matches.mjs";

function collectTargets(value, allowBarePath) {
  return collectNestedStringValues(value).flatMap((target) => {
    if (target.startsWith("./")) return [target.slice(2)];
    if (allowBarePath && !target.startsWith("#")) return [target];
    return [];
  });
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
        collectTargets(packageJson?.[field], allowBarePath),
      ),
    ),
  ];
  const missing = targets.filter((target) => !packedTargetMatches(target, packedPaths));
  return missing.length
    ? `npm pack omitted public package entrypoints: ${missing.join(", ")}.`
    : null;
}
