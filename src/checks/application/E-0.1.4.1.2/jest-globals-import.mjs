export default function isJestGlobalsImport(node) {
  const expression = node?.type === "AwaitExpression" ? node.argument : node;
  return (
    expression?.type === "ImportExpression" &&
    expression.source?.type === "StringLiteral" &&
    expression.source.value === "@jest/globals"
  );
}
