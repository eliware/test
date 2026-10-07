import { collectBindingNames } from "./collect-binding-names.mjs";
import { isJestGlobalsImport } from "./jest-globals-import.mjs";

export function collectModuleShadowedNames(program, names) {
  const tests = new Set();
  const add = (name, initializer) => {
    if (
      ["test", "it"].includes(name) ||
      (names.namespaces.has(name) && !isJestGlobalsImport(initializer))
    )
      tests.add(name);
  };
  for (const node of program.body) {
    if (node.type === "ImportDeclaration" && node.source.value !== "@jest/globals")
      node.specifiers.forEach((item) => add(item.local.name));
    else declarationNames(node, add);
  }
  return { tests, callbacks: new Set() };
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
