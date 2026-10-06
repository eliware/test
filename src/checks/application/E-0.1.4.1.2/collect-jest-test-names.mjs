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
  return names;
}

function addTestAliases(node, names) {
  if (Array.isArray(node)) return node.some((item) => addTestAliases(item, names));
  if (!node || typeof node !== "object") return false;
  let changed = false;
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
    isActiveTestExpression(node.init, names) &&
    !names.callbacks.has(node.id.name)
  ) {
    names.callbacks.add(node.id.name);
    changed = true;
  }
  return Object.values(node).reduce((found, item) => addTestAliases(item, names) || found, changed);
}

function isTestNamespace(node, names) {
  return (
    node?.type === "Identifier" &&
    (names.namespaces.has(node.name) || ["global", "globalThis"].includes(node.name))
  );
}

export function isActiveTestExpression(node, names) {
  if (node?.type === "Identifier") return names.callbacks.has(node.name);
  if (node?.type === "CallExpression") return isActiveTestExpression(node.callee, names);
  if (node?.type !== "MemberExpression") return false;
  const property = node.computed ? node.property.value : node.property.name;
  if (
    ["test", "it"].includes(property) &&
    node.object?.type === "Identifier" &&
    (names.namespaces.has(node.object.name) || ["global", "globalThis"].includes(node.object.name))
  )
    return true;
  return (
    ["each", "only", "concurrent", "failing"].includes(property) &&
    isActiveTestExpression(node.object, names)
  );
}
