const modulePath = /\.(?:mjs|js|mts|ts|jsx|tsx|cjs|cts)$/iu;
const allowedRoots = /^(?:src|bin|tests|test-fixtures|examples)\//u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function validateImplementationPlacement(files) {
  return files
    .filter(
      (path) => modulePath.test(path) && !allowedRoots.test(path) && !generatedPath.test(path),
    )
    .map((path) => `${path} is an implementation module outside its allowed root.`);
}
