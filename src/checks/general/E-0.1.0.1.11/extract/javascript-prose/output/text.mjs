export function collectOutputText(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (value.type === "StringLiteral") return [value.value];
  if (value.type === "TemplateLiteral" && !value.expressions?.length) {
    return [value.quasis.map((part) => part.value.cooked ?? part.value.raw).join("")];
  }
  if (value.type === "BinaryExpression" && value.operator === "+")
    return [...collectOutputText(value.left), ...collectOutputText(value.right)];
  if (value.type === "TaggedTemplateExpression") return collectOutputText(value.quasi);
  return [];
}
