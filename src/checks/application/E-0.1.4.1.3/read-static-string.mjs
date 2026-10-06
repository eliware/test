export function readStaticString(node, strings = new Map()) {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "BinaryExpression" && node.operator === "+") {
    const left = readStaticString(node.left, strings);
    const right = readStaticString(node.right, strings);
    return left !== null && right !== null ? left + right : null;
  }
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  if (node?.type === "Identifier") return strings.get(node.name) ?? null;
  return null;
}
