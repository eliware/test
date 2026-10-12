import { findInvalidJestTestAliases } from "./find-invalid-jest-test-aliases.mjs";
import { collectModuleShadowedNames } from "./collect-module-shadowed-jest-names.mjs";
import { collectJestDescribeNames } from "./collect-jest-describe-names.mjs";
import { collectExecutableJestTestAliases } from "./collect-executable-jest-test-aliases.mjs";

export function collectJestTestNames(program) {
  const names = {
    callbacks: new Set(["test", "it"]),
    namespaces: new Set(),
    namespaceAliases: new Map(),
  };
  for (const node of program.body) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "@jest/globals") continue;
    for (const specifier of node.specifiers)
      if (specifier.type === "ImportSpecifier" && ["test", "it"].includes(specifier.imported.name))
        names.callbacks.add(specifier.local.name);
      else if (specifier.type === "ImportNamespaceSpecifier")
        names.namespaces.add(specifier.local.name);
  }
  names.describes = collectJestDescribeNames(program);
  const moduleBindings = collectModuleShadowedNames(program, names);
  names.shadowedGlobals = moduleBindings.shadowedGlobals;
  collectExecutableJestTestAliases(program, names, moduleBindings.describes);
  // codescope ignore this because static validation blocks aliases after any same-name assignment in unproven control flow.
  for (const name of findInvalidJestTestAliases(program, names)) names.callbacks.delete(name);
  return names;
}
