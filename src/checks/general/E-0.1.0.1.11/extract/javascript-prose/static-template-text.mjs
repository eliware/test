export function staticTemplateText(template) {
  let text = "";
  for (let index = 0; index < template.quasis.length; index += 1) {
    text += template.quasis[index].value.cooked ?? template.quasis[index].value.raw;
    if (index < template.expressions.length) {
      const expression = staticStringValue(template.expressions[index]);
      if (expression === undefined) return undefined;
      text += expression;
    }
  }
  return text;
}

export function staticStringValue(expression) {
  if (!expression || typeof expression !== "object") return undefined;
  if (expression.type === "StringLiteral") return expression.value;
  if (expression.type === "TemplateLiteral") return staticTemplateText(expression);
  if (expression.type === "BinaryExpression" && expression.operator === "+") {
    const left = staticStringValue(expression.left);
    const right = staticStringValue(expression.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  return undefined;
}
