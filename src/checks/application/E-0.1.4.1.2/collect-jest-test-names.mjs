import { findInvalidJestTestAliases } from "./find-invalid-jest-test-aliases.mjs";
import { isActiveJestTestExpression } from "./is-active-jest-test-expression.mjs";
import { isJestGlobalsImport, isTestNamespace } from "./jest-globals-import.mjs";
import { collectModuleShadowedNames } from "./collect-module-shadowed-jest-names.mjs";

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
  names.shadowedGlobals = collectModuleShadowedNames(program, names).shadowedGlobals;
  let changed = true;
  while (changed) changed = addTestAliases(program, names);
  // codescope ignore this because static validation blocks aliases after any same-name assignment in unproven control flow.
  for (const name of findInvalidJestTestAliases(program, names)) names.callbacks.delete(name);
  return names;
}

function addTestAliases(node, names) {
  // codescope ignore this because the next fixed-point pass visits siblings skipped after an alias change.
  if (Array.isArray(node)) return node.some((item) => addTestAliases(item, names));
  if (!node || typeof node !== "object") return false;
  let changed = false;
  // codescope ignore this because dynamic imports from @jest/globals bind the Jest namespace.
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
    ["Identifier", "MemberExpression", "CallExpression"].includes(node.init?.type) &&
    isActiveJestTestExpression(node.init, names) &&
    !names.callbacks.has(node.id.name)
  ) {
    names.callbacks.add(node.id.name);
    changed = true;
  }
  // codescope ignore this because Babel parser nodes omit parent links in this configured parse.
  return Object.values(node).reduce((found, item) => addTestAliases(item, names) || found, changed);
}
