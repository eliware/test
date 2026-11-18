const repositoryIgnoredPath = /(?:^|\/)(?:test-results|artifacts)(?:\/|$)/u;
export default function isRepositoryIgnoredPath(path) {
  return repositoryIgnoredPath.test(path.replaceAll("\\", "/"));
}
