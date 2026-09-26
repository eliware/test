export function staticValue(node, bindings) {
  if (!node) return undefined;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  if (node.type === "ArrayExpression") {
    const values = node.elements.map((element) => staticValue(element, bindings));
    return values.every((value) => value !== undefined) ? values : undefined;
  }
  if (node.type === "Identifier") return bindings.get(node.name);
  return undefined;
}

export function bindPattern(pattern, value, bindings) {
  if (pattern?.type !== "ArrayPattern" || !Array.isArray(value)) return;
  pattern.elements.forEach((element, index) => {
    if (element?.type === "Identifier") bindings.set(element.name, value[index]);
  });
}
