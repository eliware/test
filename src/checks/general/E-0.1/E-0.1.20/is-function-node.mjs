const functionNodeTypes = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "ObjectMethod",
  "ClassMethod",
  "ClassPrivateMethod",
]);

export function isFunctionNode(node) {
  return functionNodeTypes.has(node?.type);
}
