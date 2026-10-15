const modulePath = /\.(?:mjs|js|mts|ts|jsx|tsx|cjs|cts)$/iu;
const allowedRoots = /^(?:src|bin|tests|test-fixtures|examples)\//u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function validateImplementationPlacement(files, profiles = []) {
  const discoveryRoots = [];
  if (profiles.includes("discord")) discoveryRoots.push("commands", "events");
  if (profiles.includes("mcp-server")) discoveryRoots.push("tools");
  const allowedDiscoveryPath = new RegExp(`^(?:${discoveryRoots.join("|")})/`, "u");
  return files
    .filter(
      (path) =>
        modulePath.test(path) &&
        !allowedRoots.test(path) &&
        !allowedDiscoveryPath.test(path) &&
        !generatedPath.test(path),
    )
    .map((path) => `${path} is an implementation module outside its allowed root.`);
}
