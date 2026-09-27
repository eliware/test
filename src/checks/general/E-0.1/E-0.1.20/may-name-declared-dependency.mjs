export function mayNameDeclaredDependency(node, declared) {
  if (!node) return false;
  if (node.type === "StringLiteral")
    return declared.some((name) => node.value === name || node.value.startsWith(`${name}/`));
  if (node.type === "TemplateLiteral")
    return node.quasis.some((part) => declared.some((name) => part.value.raw.includes(name)));
  if (node.type === "BinaryExpression")
    return (
      mayNameDeclaredDependency(node.left, declared) ||
      mayNameDeclaredDependency(node.right, declared)
    );
  return false;
}
