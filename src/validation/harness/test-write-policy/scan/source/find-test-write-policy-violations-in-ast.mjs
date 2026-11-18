import findFilesystemApiViolations from "../filesystem-apis.mjs";
import findFileHandleWriteViolations from "../../find-file-handle-write-violations.mjs";
function findTestWritePolicyViolationsInAst(ast, filePath) {
  return [
    ...findFilesystemApiViolations(ast, filePath),
    ...findFileHandleWriteViolations(ast, filePath),
  ];
}
export default findTestWritePolicyViolationsInAst;
