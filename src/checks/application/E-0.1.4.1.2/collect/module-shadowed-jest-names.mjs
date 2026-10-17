import { collectBindingNames } from "./binding-names.mjs";
import { isJestGlobalsImport } from "../jest-globals-import.mjs";
import { collectAssignedJestSuiteNames } from "./assigned-jest-suite-names.mjs";
import { collectHoistedVarNames } from "./hoisted-var-names.mjs";

export function collectModuleShadowedNames(program, names) {
  const tests = new Set();
  const describes = new Set();
  const shadowedGlobals = new Set();
  const add = (name, initializer) => {
    if (["global", "globalThis"].includes(name) && !isJestGlobalsImport(initializer))
      shadowedGlobals.add(name);
    if (
      ["test", "it"].includes(name) ||
      (names.namespaces.has(name) && !isJestGlobalsImport(initializer))
    )
      tests.add(name);
    if (names.describes?.has(name) && !isJestGlobalsImport(initializer)) describes.add(name);
  };
  for (const node of program.body) {
    if (node.type === "ImportDeclaration" && node.source.value !== "@jest/globals")
      node.specifiers.forEach((item) => add(item.local.name));
    else {
      declarationNames(node, add);
      collectHoistedVarNames(node, add);
    }
    collectAssignedJestSuiteNames(node, names.describes, describes);
  }
  return { tests, callbacks: new Set(), describes, shadowedGlobals };
}

function declarationNames(node, add) {
  if (!node) return;
  if (node.type === "ExportNamedDeclaration") return declarationNames(node.declaration, add);
  if (node.type === "VariableDeclaration")
    node.declarations.forEach((item) =>
      collectBindingNames(item.id).forEach((name) => add(name, item.init)),
    );
  else if (["FunctionDeclaration", "ClassDeclaration"].includes(node.type)) add(node.id?.name);
}
