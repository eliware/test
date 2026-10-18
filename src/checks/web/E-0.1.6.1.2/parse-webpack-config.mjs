import { parse } from "@babel/parser";

export function parseWebpackConfig(source) {
  try {
    const program = parse(source, { sourceType: "module" }).program;
    const defaultDeclarations = program.body.filter(
      (item) => item.type === "ExportDefaultDeclaration",
    );
    if (
      defaultDeclarations.length !== 1 ||
      defaultDeclarations[0].declaration.type !== "ObjectExpression"
    )
      return null;
    const properties = readProperties(defaultDeclarations[0].declaration);
    if (!properties) return null;
    return { program, properties };
  } catch {
    return null;
  }
}

export function readProperties(node) {
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

export function getImportedLocalName(program, moduleName, importedName) {
  for (const item of program.body) {
    if (item.type !== "ImportDeclaration" || item.source.value !== moduleName) continue;
    const specifier = item.specifiers.find(
      (value) =>
        value.type === "ImportSpecifier" &&
        (value.imported.name ?? value.imported.value) === importedName,
    );
    if (specifier) return specifier.local.name;
  }
  return null;
}
