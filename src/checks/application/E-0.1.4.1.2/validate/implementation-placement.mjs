import resolveAllowedImplementationRoots from "./implementation-placement/allowed-roots.mjs";
const modulePath = /\.(?:mjs|js|mts|ts|jsx|tsx|cjs|cts)$/iu;
const allowedRoots = /^(?:src|bin|tests|test-fixtures|examples)\//u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
export default function validateImplementationPlacement(files, profiles = [], packageJson = {}) {
  const { validatorPaths, allowedRootFiles, allowedDiscoveryPath } =
    resolveAllowedImplementationRoots(profiles, packageJson);
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
