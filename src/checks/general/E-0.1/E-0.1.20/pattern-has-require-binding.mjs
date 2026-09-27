export function patternHasRequire(pattern) {
  if (!pattern || typeof pattern !== "object") return false;
  if (pattern.type === "Identifier") return pattern.name === "require";
  if (pattern.type === "RestElement" || pattern.type === "AssignmentPattern")
    return patternHasRequire(pattern.argument ?? pattern.left);
  if (pattern.type === "ArrayPattern") return pattern.elements.some(patternHasRequire);
  if (pattern.type === "ObjectPattern") {
    return pattern.properties.some((property) =>
      patternHasRequire(property.type === "RestElement" ? property.argument : property.value),
    );
  }
  return false;
}
