import { isActiveJestTestExpression } from "../is/active-jest-test-expression.mjs";
import { isJestGlobalsImport, isTestNamespace } from "../jest-globals-import.mjs";

export function collectJestTestAliases(node, names) {
  if (node.type !== "VariableDeclarator") return false;
  if (isJestGlobalsImport(node.init)) {
    if (node.id?.type === "Identifier" && !names.namespaces.has(node.id.name)) {
      names.namespaces.add(node.id.name);
      return true;
    }
    return collectDestructuredAliases(node.id, names);
  }
  if (node.id?.type === "ObjectPattern" && isTestNamespace(node.init, names))
    return collectDestructuredAliases(node.id, names, node.init.name);
  if (
    node.id?.type !== "Identifier" ||
    !["Identifier", "MemberExpression", "CallExpression"].includes(node.init?.type) ||
    !isActiveJestTestExpression(node.init, names) ||
    names.callbacks.has(node.id.name)
  )
    return false;
  names.callbacks.add(node.id.name);
  return true;
}

function collectDestructuredAliases(pattern, names, namespaceName) {
  if (pattern?.type !== "ObjectPattern") return false;
  let changed = false;
  for (const property of pattern.properties) {
    const imported = property.key?.name ?? property.key?.value;
    const local = property.value?.type === "Identifier" ? property.value.name : null;
    if (["test", "it"].includes(imported) && local && !names.callbacks.has(local)) {
      names.callbacks.add(local);
      if (namespaceName) {
        names.namespaceAliases ??= new Map();
        const aliases = names.namespaceAliases.get(namespaceName) ?? new Set();
        aliases.add(local);
        names.namespaceAliases.set(namespaceName, aliases);
      }
      changed = true;
    }
  }
  return changed;
}
