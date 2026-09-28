import { subprocessFunctions } from "./knit-call-analysis.mjs";
import { sideEffectModules as sourceOperationModules } from "./knit-source-operation-policy.mjs";

const sideEffectModules = new Set([
  ...sourceOperationModules,
  "node:child_process",
  "child_process",
]);

export function collectImports(program) {
  const names = new Map();
  const namespaces = new Set();
  const sideEffectNamespaces = new Set();
  const unsupported = [];
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (
      sideEffectModules.has(statement.source.value) &&
      !["node:child_process", "child_process"].includes(statement.source.value)
    ) {
      for (const specifier of statement.specifiers) {
        if (
          specifier.type === "ImportNamespaceSpecifier" ||
          specifier.type === "ImportDefaultSpecifier"
        )
          sideEffectNamespaces.add(specifier.local.name);
        if (specifier.type === "ImportSpecifier")
          names.set(specifier.local.name, `${statement.source.value}:${specifier.imported.name}`);
      }
    }
    if (statement.source.value !== "node:child_process") continue;
    for (const specifier of statement.specifiers) {
      if (
        specifier.type === "ImportSpecifier" &&
        subprocessFunctions.has(specifier.imported.name)
      ) {
        names.set(specifier.local.name, specifier.imported.name);
      } else if (specifier.type === "ImportNamespaceSpecifier") {
        namespaces.add(specifier.local.name);
      } else {
        unsupported.push(statement.start);
      }
    }
  }
  return { names, namespaces, sideEffectNamespaces, unsupported };
}
