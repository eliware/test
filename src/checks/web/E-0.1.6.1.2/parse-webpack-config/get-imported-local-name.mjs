function getImportedLocalName(program, moduleName, importedName) {
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
export default getImportedLocalName;
