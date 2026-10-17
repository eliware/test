import { readStaticString } from "../read-static-string.mjs";

export function findImportSpecifier(node, strings) {
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type))
    return readStaticString(node.source, strings);
  if (node.type === "ImportExpression") return readStaticString(node.source, strings);
  return null;
}
