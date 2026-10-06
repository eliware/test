export function isJestGlobalsImport(node) {
  const expression = node?.type === "AwaitExpression" ? node.argument : node;
  return (
    expression?.type === "ImportExpression" &&
    expression.source?.type === "StringLiteral" &&
    expression.source.value === "@jest/globals"
  );
}

export function isTestNamespace(node, names) {
  return (
    node?.type === "Identifier" &&
    (names.namespaces.has(node.name) || ["global", "globalThis"].includes(node.name))
  );
}
