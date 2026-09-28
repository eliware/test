import { subprocessFunctions } from "./knit-call-analysis.mjs";

const childProcessModules = new Set(["node:child_process", "child_process"]);

export function collectImports(program) {
  const names = new Map();
  const namespaces = new Set();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (!childProcessModules.has(statement.source.value)) continue;
    for (const specifier of statement.specifiers) {
      if (
        specifier.type === "ImportSpecifier" &&
        subprocessFunctions.has(specifier.imported.name)
      ) {
        names.set(specifier.local.name, specifier.imported.name);
      } else if (specifier.type === "ImportNamespaceSpecifier") {
        namespaces.add(specifier.local.name);
      }
    }
  }
  return { names, namespaces };
}
