import { parse } from "@babel/parser";
import { dirname, posix } from "node:path";

export function inspectJestTestModule(content, testPath, sourcePath) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false, importsSource: false };
  }
  return {
    hasExecutableTest: containsTestCall(ast.program),
    importsSource: containsSourceImport(ast.program, testPath, sourcePath),
  };
}

function containsTestCall(node) {
  if (Array.isArray(node)) return node.some(containsTestCall);
  if (!node || typeof node !== "object") return false;
  if (node.type === "CallExpression" && isTestCall(node)) return true;
  return Object.values(node).some(containsTestCall);
}

function isTestCall(call) {
  if (!isCallback(call.arguments[1])) return false;
  if (isTestIdentifier(call.callee)) return true;
  const tableCall = call.callee;
  return (
    tableCall.type === "CallExpression" &&
    tableCall.callee.type === "MemberExpression" &&
    tableCall.callee.property.name === "each" &&
    isTestIdentifier(tableCall.callee.object)
  );
}

function isTestIdentifier(node) {
  return node.type === "Identifier" && ["test", "it"].includes(node.name);
}

function isCallback(node) {
  return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}

function containsSourceImport(node, testPath, sourcePath) {
  if (Array.isArray(node))
    return node.some((item) => containsSourceImport(item, testPath, sourcePath));
  if (!node || typeof node !== "object") return false;
  if (isModuleReference(node)) {
    const specifier = node.source.value;
    if (
      specifier.startsWith(".") &&
      posix.normalize(posix.join(dirname(testPath), specifier)) === sourcePath
    )
      return true;
  }
  return Object.values(node).some((item) => containsSourceImport(item, testPath, sourcePath));
}

function isModuleReference(node) {
  return (
    ((node.type === "ImportDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportAllDeclaration") &&
      node.source) ||
    (node.type === "ImportExpression" && node.source)
  );
}
