import { parse } from "@babel/parser";
import { dirname, posix } from "node:path";

export function inspectJestTestModule(content, testPath, sourcePath) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false, importsSource: false };
  }
  const testNames = findTestNames(ast.program);
  return {
    hasExecutableTest: containsTestCall(ast.program, testNames),
    importsSource: containsSourceImport(ast.program, testPath, sourcePath),
  };
}

function findTestNames(program) {
  const names = new Set(["test", "it"]);
  for (const node of program.body) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "@jest/globals") continue;
    for (const specifier of node.specifiers)
      if (specifier.type === "ImportSpecifier" && ["test", "it"].includes(specifier.imported.name))
        names.add(specifier.local.name);
  }
  return names;
}

function containsTestCall(node, names) {
  if (Array.isArray(node)) return node.some((item) => containsTestCall(item, names));
  if (!node || typeof node !== "object") return false;
  if (node.type === "CallExpression" && isTestCall(node, names)) return true;
  return Object.values(node).some((item) => containsTestCall(item, names));
}

function isTestCall(call, names) {
  if (!isCallback(call.arguments[1])) return false;
  return isActiveTestExpression(call.callee, names);
}

function isActiveTestExpression(node, names) {
  if (node?.type === "Identifier") return names.has(node.name);
  if (node?.type === "CallExpression") return isActiveTestExpression(node.callee, names);
  if (node?.type !== "MemberExpression") return false;
  const property = node.computed ? node.property.value : node.property.name;
  return (
    ["each", "only", "concurrent", "failing"].includes(property) &&
    isActiveTestExpression(node.object, names)
  );
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
