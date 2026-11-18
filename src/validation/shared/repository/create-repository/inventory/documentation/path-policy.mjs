const excludedDocumentationPath = /(?:^|\/)(?:\.git|node_modules|test-results)(?:\/|$)/u;
export const generatedDocumentationPath = /(?:^|\/)(?:coverage|dist|build)(?:\/|$)/u;
export default function isExcludedDocumentationPath(path) {
  return excludedDocumentationPath.test(path);
}
