export function resolvePackageOverride(overrides, parentName, dependencyName) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return undefined;
  const parentRule = parentName ? overrides[parentName] : undefined;
  const scoped =
    parentRule && typeof parentRule === "object" && !Array.isArray(parentRule)
      ? overrideValue(parentRule, dependencyName)
      : undefined;
  return scoped ?? overrideValue(overrides[dependencyName], ".");
}

function overrideValue(rule, key) {
  if (typeof rule === "string") return rule;
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return undefined;
  return typeof rule[key] === "string" ? rule[key] : undefined;
}
