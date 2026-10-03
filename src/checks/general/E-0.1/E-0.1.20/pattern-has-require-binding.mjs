export function patternHasRequire(pattern) {
  const pending = [pattern];
  const visited = new WeakSet();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    if (current.type === "Identifier" && current.name === "require") return true;
    if (current.type === "RestElement") pending.push(current.argument);
    if (current.type === "AssignmentPattern") pending.push(current.left);
    if (current.type === "ArrayPattern") {
      for (const element of current.elements) pending.push(element);
    }
    if (current.type === "ObjectPattern") {
      for (const property of current.properties) {
        pending.push(property.type === "RestElement" ? property.argument : property.value);
      }
    }
  }
  return false;
}
