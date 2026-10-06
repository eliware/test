import { findInvalidJestTestAliases } from "./find-invalid-jest-test-aliases.mjs";
import { isActiveJestTestExpression } from "./is-active-jest-test-expression.mjs";
import { isJestGlobalsImport, isTestNamespace } from "./jest-globals-import.mjs";

export function collectJestTestNames(program) {
  const names = { callbacks: new Set(["test", "it"]), namespaces: new Set() };
  for (const node of program.body) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "@jest/globals") continue;
    for (const specifier of node.specifiers)
      if (specifier.type === "ImportSpecifier" && ["test", "it"].includes(specifier.imported.name))
        names.callbacks.add(specifier.local.name);
      else if (specifier.type === "ImportNamespaceSpecifier")
        names.namespaces.add(specifier.local.name);
  }
  let changed = true;
  while (changed) changed = addTestAliases(program, names);
  for (const name of findInvalidJestTestAliases(program, names)) names.callbacks.delete(name);
  return names;
}

function addTestAliases(node, names) {
  if (Array.isArray(node)) return node.some((item) => addTestAliases(item, names));
  if (!node || typeof node !== "object") return false;
  let changed = false;
  if (node.type === "VariableDeclarator" && isJestGlobalsImport(node.init)) {
    if (node.id?.type === "Identifier" && !names.namespaces.has(node.id.name)) {
      names.namespaces.add(node.id.name);
      changed = true;
    }
    if (node.id?.type === "ObjectPattern")
      for (const property of node.id.properties) {
        const imported = property.key?.name ?? property.key?.value;
        if (
          ["test", "it"].includes(imported) &&
          property.value?.type === "Identifier" &&
          !names.callbacks.has(property.value.name)
        ) {
          names.callbacks.add(property.value.name);
          changed = true;
        }
      }
  }
  if (
    node.type === "VariableDeclarator" &&
    node.id?.type === "ObjectPattern" &&
    isTestNamespace(node.init, names)
  ) {
    for (const property of node.id.properties) {
      const imported = property.key?.name ?? property.key?.value;
      if (
        ["test", "it"].includes(imported) &&
        property.value?.type === "Identifier" &&
        !names.callbacks.has(property.value.name)
      ) {
        names.callbacks.add(property.value.name);
        changed = true;
      }
    }
  }
  if (
    node.type === "VariableDeclarator" &&
    node.id?.type === "Identifier" &&
    ["Identifier", "MemberExpression"].includes(node.init?.type) &&
    isActiveJestTestExpression(node.init, names) &&
    !names.callbacks.has(node.id.name)
  ) {
    names.callbacks.add(node.id.name);
    changed = true;
  }
  return Object.values(node).reduce((found, item) => addTestAliases(item, names) || found, changed);
}
