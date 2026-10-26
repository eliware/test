const excludedDocumentationPath = /(?:^|\/)(?:\.git|node_modules|test-results)(?:\/|$)/u;

export const generatedDocumentationPath = /(?:^|\/)(?:coverage|dist|build)(?:\/|$)/u;

export function isExcludedDocumentationPath(path) {
  return excludedDocumentationPath.test(path);
}

export function shouldSkipDocumentationPath(path, includeGenerated) {
  return (
    isExcludedDocumentationPath(path) ||
    (!includeGenerated && generatedDocumentationPath.test(path))
  );
}
