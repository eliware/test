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

function targetExists(target, packedPaths) {
  const wildcard = target.indexOf("*");
  if (wildcard < 0) return packedPaths.has(target);
  const before = target.slice(0, wildcard);
  const after = target.slice(wildcard + 1);
  // codescope ignore this because Node.js export wildcards also match slash-separated nested paths.
  return [...packedPaths].some(
    (path) =>
      path.length > before.length + after.length && path.startsWith(before) && path.endsWith(after),
  );
}

export function validatePackedEntrypoints(packageJson, packedPaths) {
  // codescope ignore this because package-relative bare paths are valid for main, bin, and type entrypoints.
  const declared = [
    packageJson?.main,
    packageJson?.module,
    packageJson?.types,
    packageJson?.typings,
    packageJson?.bin,
    packageJson?.exports,
  ];
  const targets = [
    ...new Set(declared.flatMap((value, index) => collectTargets(value, [], index < 5))),
  ];
  const missing = targets.filter((target) => !targetExists(target, packedPaths));
  return missing.length
    ? `npm pack omitted public package entrypoints: ${missing.join(", ")}.`
    : null;
}
