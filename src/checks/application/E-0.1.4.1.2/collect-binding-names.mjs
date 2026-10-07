export function collectBindingNames(node) {
  if (node?.type === "Identifier") return [node.name];
  if (node?.type === "RestElement") return collectBindingNames(node.argument);
  if (node?.type === "AssignmentPattern") return collectBindingNames(node.left);
  if (["ObjectPattern", "ArrayPattern"].includes(node?.type))
    return (node.properties ?? []).flatMap((property) =>
      collectBindingNames(
        property.type === "RestElement" ? property.argument : (property.value ?? property),
      ),
    );
  return [];
}
