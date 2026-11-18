import isExcludedDocumentationPath, { generatedDocumentationPath } from "../path-policy.mjs";
function shouldSkipDocumentationPath(path, includeGenerated) {
  return (
    isExcludedDocumentationPath(path) ||
    (!includeGenerated && generatedDocumentationPath.test(path))
  );
}
export default shouldSkipDocumentationPath;
