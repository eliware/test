const fixturePath =
  /(?:^|\/)(?:generated|test-fixtures|fixtures|__fixtures__|__snapshots__)(?:\/|$)/u;
function isRepositoryFixturePath(path) {
  return fixturePath.test(path);
}
export default isRepositoryFixturePath;
