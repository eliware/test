export function isActiveJestTestExpression(node, names) {
  if (node?.type === "Identifier") return names.callbacks.has(node.name);
  if (node?.type === "CallExpression") return isActiveJestTestExpression(node.callee, names);
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
    isActiveJestTestExpression(node.object, names)
  );
}
