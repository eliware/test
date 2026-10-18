const modulePath = /\.(?:mjs|js|mts|ts|jsx|tsx|cjs|cts)$/iu;
const allowedRoots = /^(?:src|bin|tests|test-fixtures|examples)\//u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function validateImplementationPlacement(files, profiles = [], packageJson = {}) {
  const discoveryRoots = [];
  const validatorPaths = new Set(findPackageScriptValidatorPaths(packageJson));
  if (profiles.includes("discord")) discoveryRoots.push("commands", "events");
  if (profiles.includes("mcp-server")) discoveryRoots.push("tools");
  const allowedRootFiles = profiles.includes("web") ? new Set(["webpack.config.mjs"]) : new Set();
  const allowedDiscoveryPath = new RegExp(`^(?:${discoveryRoots.join("|")})/`, "u");
  return files
    .filter(
      (path) =>
        modulePath.test(path) &&
        !validatorPaths.has(path) &&
        !allowedRootFiles.has(path) &&
        !allowedRoots.test(path) &&
        !allowedDiscoveryPath.test(path) &&
        !generatedPath.test(path),
    )
    .map((path) => `${path} is an implementation module outside its allowed root.`);
}
import { findPackageScriptValidatorPaths } from "../../../shared/package-scripts/validate/package-script-file-locations.mjs";
