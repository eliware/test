const moduleFile = /\.(?:mjs|js|mts|ts|jsx|tsx|cjs|cts)$/iu;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function validateLibrarySourcePlacement(files) {
  const allowedRoot = /^(?:src|tests|test-fixtures|examples)\//u;
  return files
    .filter((path) => moduleFile.test(path) && !allowedRoot.test(path) && !generatedPath.test(path))
    .map((path) => `${path} is outside the allowed library source and test directories.`);
}
