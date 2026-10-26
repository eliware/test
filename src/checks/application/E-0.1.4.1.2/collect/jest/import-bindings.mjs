export function collectImportedJestTestBindings(program, names) {
  for (const node of program.body) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "@jest/globals") continue;
    for (const specifier of node.specifiers)
      if (specifier.type === "ImportSpecifier" && ["test", "it"].includes(specifier.imported.name))
        names.callbacks.add(specifier.local.name);
      else if (specifier.type === "ImportNamespaceSpecifier")
        names.namespaces.add(specifier.local.name);
  }
}
