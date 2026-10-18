export function collectJestCallbackNames(root) {
  const names = new Set();
  visit(root, names);
  return names;
}

function visit(node, names) {
  if (Array.isArray(node)) node.forEach((item) => visit(item, names));
  else if (node && typeof node === "object") {
    if (node.type === "FunctionDeclaration" && node.id?.name) names.add(node.id.name);
    if (
      node.type === "VariableDeclarator" &&
      ["ArrowFunctionExpression", "FunctionExpression"].includes(node.init?.type) &&
      node.id?.type === "Identifier"
    )
      names.add(node.id.name);
    Object.values(node).forEach((item) => visit(item, names));
  }
}
