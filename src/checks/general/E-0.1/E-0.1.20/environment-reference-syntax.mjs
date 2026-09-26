export function isProcessEnv(node) {
  return (
    node?.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "process" &&
    ((node.computed && node.property.type === "StringLiteral" && node.property.value === "env") ||
      (!node.computed && node.property.type === "Identifier" && node.property.name === "env"))
  );
}

export function propertyName(node, computed = false) {
  if (!node) return undefined;
  if (!computed && node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0]?.value?.cooked;
  return undefined;
}
