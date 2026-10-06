import { dirname, posix } from "node:path";

export function referencesTestSource(node, testPath, sourcePath) {
  if (Array.isArray(node))
    return node.some((item) => referencesTestSource(item, testPath, sourcePath));
  if (!node || typeof node !== "object") return false;
  const specifier = getSpecifier(node);
  if (
    specifier?.startsWith(".") &&
    posix.normalize(posix.join(dirname(testPath), specifier)) === sourcePath
  )
    return true;
  return Object.values(node).some((item) => referencesTestSource(item, testPath, sourcePath));
}

function getSpecifier(node) {
  if (
    ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) ||
    node.type === "ImportExpression"
  )
    return staticString(node.source);
  return null;
}

function staticString(node) {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  return null;
}
