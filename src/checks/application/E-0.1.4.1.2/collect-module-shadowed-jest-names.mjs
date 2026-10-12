import { collectBindingNames } from "./collect-binding-names.mjs";
import { isJestGlobalsImport } from "./jest-globals-import.mjs";

export function collectModuleShadowedNames(program, names) {
  const tests = new Set();
  const describes = new Set();
  const shadowedGlobals = new Set();
  const add = (name, initializer) => {
    if (["global", "globalThis"].includes(name) && !isJestGlobalsImport(initializer))
      shadowedGlobals.add(name);
    if (
      ["test", "it"].includes(name) ||
      (names.namespaces.has(name) && !isJestGlobalsImport(initializer))
    )
      tests.add(name);
    if (names.describes?.has(name) && !isJestGlobalsImport(initializer)) describes.add(name);
  };
  for (const node of program.body) {
    if (node.type === "ImportDeclaration" && node.source.value !== "@jest/globals")
      node.specifiers.forEach((item) => add(item.local.name));
    else {
      declarationNames(node, add);
      collectHoistedVarNames(node, add);
    }
    collectAssignedDescribeNames(node, names.describes, describes);
  }
  return { tests, callbacks: new Set(), describes, shadowedGlobals };
}

function collectAssignedDescribeNames(node, describeNames, describes) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") return;
  if (
    node.type === "AssignmentExpression" &&
    node.left?.type === "Identifier" &&
    describeNames?.has(node.left.name)
  )
    describes.add(node.left.name);
  for (const value of Object.values(node))
    if (Array.isArray(value))
      value.forEach((child) => collectAssignedDescribeNames(child, describeNames, describes));
    else if (value?.type) collectAssignedDescribeNames(value, describeNames, describes);
}

function collectHoistedVarNames(node, add) {
  if (!node || typeof node !== "object") return;
  if (
    [
      "FunctionDeclaration",
      "FunctionExpression",
      "ArrowFunctionExpression",
      "ClassDeclaration",
      "ClassExpression",
    ].includes(node.type)
  )
    return;
  if (node.type === "VariableDeclaration") {
    if (node.kind === "var")
      node.declarations.forEach((item) =>
        collectBindingNames(item.id).forEach((name) => add(name, item.init)),
      );
    return;
  }
  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) value.forEach((item) => collectHoistedVarNames(item, add));
    else collectHoistedVarNames(value, add);
  });
}

function declarationNames(node, add) {
  if (!node) return;
  if (node.type === "ExportNamedDeclaration") return declarationNames(node.declaration, add);
  if (node.type === "VariableDeclaration")
    node.declarations.forEach((item) =>
      collectBindingNames(item.id).forEach((name) => add(name, item.init)),
    );
  else if (["FunctionDeclaration", "ClassDeclaration"].includes(node.type)) add(node.id?.name);
}
