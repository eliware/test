export function collectAssignedJestSuiteNames(node, describeNames, describes = new Set()) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") return describes;
  if (
    node.type === "AssignmentExpression" &&
    node.left?.type === "Identifier" &&
    describeNames?.has(node.left.name)
  )
    describes.add(node.left.name);
  for (const value of Object.values(node))
    if (Array.isArray(value))
      value.forEach((child) => collectAssignedJestSuiteNames(child, describeNames, describes));
    else if (value?.type) collectAssignedJestSuiteNames(value, describeNames, describes);
  return describes;
}
