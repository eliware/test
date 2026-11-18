const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
function isGeneratedRepositoryPath(path) {
  return generatedPath.test(path);
}
export default isGeneratedRepositoryPath;
