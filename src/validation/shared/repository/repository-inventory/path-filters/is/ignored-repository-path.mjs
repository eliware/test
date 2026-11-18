const repositoryIgnoredPath = /(?:^|\/)(?:test-results|artifacts)(?:\/|$)/u;
function isRepositoryIgnoredPath(path) {
  return repositoryIgnoredPath.test(path.replaceAll("\\", "/"));
}
function isIgnoredRepositoryPath(path, ignoredPaths = new Set()) {
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
export default isIgnoredRepositoryPath;
