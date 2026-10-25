import { collectNestedStringValues } from "../../../../../shared/package/collect-nested-string-values.mjs";

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

function collectTargets(value, allowBarePath) {
  return collectNestedStringValues(value).flatMap((target) => {
    if (target.startsWith("./")) return [target.slice(2)];
    if (allowBarePath && !target.startsWith("#")) return [target];
    return [];
  });
}

export function collectPackedEntrypointTargets(packageJson) {
  return [
    ...new Set(
      packageTargetFields.flatMap(([field, allowBarePath]) =>
        collectTargets(packageJson?.[field], allowBarePath),
      ),
    ),
  ];
}
