import { subprocessFunctions } from "./knit-call-analysis.mjs";

const sideEffectModules = new Set([
  "node:child_process", "child_process", "node:fs", "fs", "node:fs/promises",
  "fs/promises", "node:http", "http", "node:https", "https", "node:net", "net",
  "node:dgram", "dgram",
]);

export function collectImports(program) {
  const names = new Map();
  const namespaces = new Set();
  const sideEffectNamespaces = new Set();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (sideEffectModules.has(statement.source.value)) {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier")
          sideEffectNamespaces.add(specifier.local.name);
        if (specifier.type === "ImportSpecifier")
          names.set(specifier.local.name, `${statement.source.value}:${specifier.imported.name}`);
      }
    }
    if (statement.source.value !== "node:child_process") continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type === "ImportSpecifier" && subprocessFunctions.has(specifier.imported.name))
        names.set(specifier.local.name, specifier.imported.name);
      if (specifier.type === "ImportNamespaceSpecifier") namespaces.add(specifier.local.name);
    }
  }
  return { names, namespaces, sideEffectNamespaces };
}
