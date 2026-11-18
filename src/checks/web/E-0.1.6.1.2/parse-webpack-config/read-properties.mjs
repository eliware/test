function readProperties(node) {
  if (node?.type !== "ObjectExpression") return null;
  const properties = new Map();
  for (const property of node.properties) {
    if (property.type !== "ObjectProperty" || property.computed || property.shorthand) return null;
    const key = property.key.type === "Identifier" ? property.key.name : property.key.value;
    if (typeof key !== "string" || properties.has(key)) return null;
    properties.set(key, property.value);
  }
  return properties;
}
export default readProperties;
