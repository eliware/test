import { parse } from "@babel/parser";
import { findFilesystemApiViolations } from "./filesystem-apis.mjs";
import { findFileHandleWriteViolations } from "../find-file-handle-write-violations.mjs";

export function findTestWritePolicyViolations(source, filePath) {
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });
  return findTestWritePolicyViolationsInAst(ast, filePath);
}

export function findTestWritePolicyViolationsInAst(ast, filePath) {
  return [
    ...findFilesystemApiViolations(ast, filePath),
    ...findFileHandleWriteViolations(ast, filePath),
  ];
}
