import { isActiveJestTestExpression } from "../is/active-jest-test-expression.mjs";

export function findInvalidJestTestAliases(program, names) {
  const invalid = new Set();
  visit(program, (node) => {
    if (
      node.type === "AssignmentExpression" &&
      node.left?.type === "Identifier" &&
      names.callbacks.has(node.left.name) &&
      !isActiveJestTestExpression(node.right, names)
    )
      invalid.add(node.left.name);
    if (node.type === "AssignmentExpression" && node.left?.type === "Identifier")
      for (const alias of names.namespaceAliases?.get(node.left.name) ?? []) invalid.add(alias);
  });
  return invalid;
}

function visit(node, callback) {
  if (!node || typeof node !== "object") return;
  callback(node);
  for (const value of Object.values(node))
    if (Array.isArray(value)) value.forEach((child) => visit(child, callback));
    else if (value && typeof value === "object") visit(value, callback);
}
