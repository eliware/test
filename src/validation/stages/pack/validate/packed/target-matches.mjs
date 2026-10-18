export function packedTargetMatches(target, packedPaths) {
  const wildcard = target.indexOf("*");
  if (wildcard < 0) return packedPaths.has(target);
  const before = target.slice(0, wildcard);
  const after = target.slice(wildcard + 1);
  return [...packedPaths].some(
    (path) =>
      path.length > before.length + after.length && path.startsWith(before) && path.endsWith(after),
  );
}
