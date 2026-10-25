export function collectBindingNames(node) {
  if (node?.type === "Identifier") return [node.name];
  if (node?.type === "RestElement") return collectBindingNames(node.argument);
  if (node?.type === "AssignmentPattern") return collectBindingNames(node.left);
  if (node?.type === "ArrayPattern")
    return (node.elements ?? []).flatMap((element) =>
      element ? collectBindingNames(element) : [],
    );
  if (node?.type === "ObjectPattern")
    return (node.properties ?? []).flatMap((property) =>
      collectBindingNames(
        property.type === "RestElement" ? property.argument : (property.value ?? property),
      ),
    );
  return [];
}
