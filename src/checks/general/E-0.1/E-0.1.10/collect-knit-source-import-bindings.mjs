import { sideEffectModules } from "./knit-source-operation-policy.mjs";

export function collectKnitSourceImportBindings(program) {
  const namespaces = new Set();
  const importedOperations = new Set();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration" || !sideEffectModules.has(statement.source.value))
      continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type === "ImportSpecifier") importedOperations.add(specifier.local.name);
      else namespaces.add(specifier.local.name);
    }
  }
  return { namespaces, importedOperations };
}
