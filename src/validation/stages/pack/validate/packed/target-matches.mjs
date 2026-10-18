export function packedTargetMatches(target, packedPaths) {
  if (!target.includes("*")) return packedPaths.has(target);
  const pattern = new RegExp(`^${target.split("*").map(escapeRegExp).join(".*")}$`, "u");
  return [...packedPaths].some((path) => pattern.test(path));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
