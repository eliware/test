const repositoryIgnoredPath = /(?:^|\/)test-results(?:\/|$)/u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
const fixturePath =
  /(?:^|\/)(?:generated|test-fixtures|fixtures|__fixtures__|__snapshots__)(?:\/|$)/u;

export function isRepositoryIgnoredPath(path) {
  return repositoryIgnoredPath.test(path);
}

export function isGeneratedRepositoryPath(path) {
  return generatedPath.test(path);
}

export function isRepositoryFixturePath(path) {
  return fixturePath.test(path);
}
