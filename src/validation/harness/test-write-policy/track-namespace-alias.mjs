export function trackNamespaceAlias(node, namespaceBindings) {
  if (node.id?.type !== "Identifier") return false;
  if (node.init?.type !== "Identifier") return false;
  if (!namespaceBindings.has(node.init.name)) return false;
  namespaceBindings.add(node.id.name);
  return true;
}
