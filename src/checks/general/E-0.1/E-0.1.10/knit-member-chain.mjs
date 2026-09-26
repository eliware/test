export function identifierOrMemberRoot(node) {
  if (node?.type === "Identifier") return node.name;
  if (node?.type !== "MemberExpression" && node?.type !== "OptionalMemberExpression") return undefined;
  return memberChain(node).root;
}

export function memberChain(node) {
  let current = node;
  const names = [];
  while (current?.type === "MemberExpression" || current?.type === "OptionalMemberExpression") {
    if (!current.computed && current.property?.type === "Identifier") names.push(current.property.name);
    else if (current.computed && current.property?.type === "StringLiteral") names.push(current.property.value);
    else names.push(undefined);
    current = current.object;
  }
  return { root: current?.type === "Identifier" ? current.name : undefined, names };
}
