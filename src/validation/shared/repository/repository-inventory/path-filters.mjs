const repositoryIgnoredPath = /(?:^|\/)(?:test-results|artifacts)(?:\/|$)/u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
const fixturePath =
  /(?:^|\/)(?:generated|test-fixtures|fixtures|__fixtures__|__snapshots__)(?:\/|$)/u;

export function isRepositoryIgnoredPath(path) {
  return repositoryIgnoredPath.test(path.replaceAll("\\", "/"));
}

export function isIgnoredRepositoryPath(path, ignoredPaths = new Set()) {
  const normalized = path.replaceAll("\\", "/").replace(/\/$/u, "");
  if (isRepositoryIgnoredPath(normalized)) return true;
  if (ignoredPaths.has(normalized)) return true;
  let parent = normalized;
  while (parent.includes("/")) {
    parent = parent.slice(0, parent.lastIndexOf("/"));
    if (ignoredPaths.has(parent)) return true;
  }
  return false;
}

export function isGeneratedRepositoryPath(path) {
  return generatedPath.test(path);
}

export function isRepositoryFixturePath(path) {
  return fixturePath.test(path);
}
