export function isProcessEnv(node) {
  return (
    node?.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "process" &&
    ((node.computed && node.property.type === "StringLiteral" && node.property.value === "env") ||
      (!node.computed && node.property.type === "Identifier" && node.property.name === "env"))
  );
}

export function propertyName(node) {
  if (!node) return undefined;
  if (!node.computed && node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return undefined;
}
