import { isActiveJestTestExpression } from "../is/active-jest-test-expression.mjs";
import { isJestGlobalsImport, isTestNamespace } from "../jest-globals-import.mjs";

export function collectExecutableJestTestAliases(program, names, blockedDescribes) {
  let changed = true;
  while (changed) changed = visit(program, names, blockedDescribes);
}

function visit(node, names, blockedDescribes, allowFunction = false) {
  if (!node || typeof node !== "object") return false;
  if (isFunction(node)) return allowFunction && visit(node.body, names, blockedDescribes);
  let changed = collectImportAliases(node, names);
  changed = collectNamedAliases(node, names) || changed;
  const callback = getSuiteCallback(node, names.describes, blockedDescribes);
  let found = changed;
  for (const value of Object.values(node))
    for (const item of Array.isArray(value) ? value : [value])
      found = visit(item, names, blockedDescribes, item === callback) || found;
  return found;
}

function collectImportAliases(node, names) {
  if (node.type !== "VariableDeclarator" || !isJestGlobalsImport(node.init)) return false;
  if (node.id?.type === "Identifier" && !names.namespaces.has(node.id.name)) {
    names.namespaces.add(node.id.name);
    return true;
  }
  return collectDestructuredAliases(node.id, names);
}

function collectNamedAliases(node, names) {
  if (node.type !== "VariableDeclarator") return false;
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

function getSuiteCallback(node, describeNames, blockedDescribes) {
  if (node.type !== "CallExpression") return null;
  const callee = node.callee;
  const name =
    callee.type === "Identifier"
      ? callee.name
      : callee.type === "MemberExpression" &&
          (callee.computed ? callee.property.value : callee.property.name) === "only"
        ? callee.object?.name
        : null;
  const callback = node.arguments[1];
  return describeNames.has(name) && !blockedDescribes.has(name) && isFunction(callback)
    ? callback
    : null;
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
