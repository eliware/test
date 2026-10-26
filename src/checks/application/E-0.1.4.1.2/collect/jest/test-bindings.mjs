import { findInvalidJestTestAliases } from "../../find/invalid-jest-test-aliases.mjs";
import { collectModuleShadowedNames } from "../module-shadowed-jest-names.mjs";
import { collectJestDescribeNames } from "./describe-names.mjs";
import { collectExecutableJestTestAliases } from "../executable-jest-test-aliases.mjs";
import { collectImportedJestTestBindings } from "./import-bindings.mjs";

export function collectJestTestNames(program) {
  const names = {
    callbacks: new Set(["test", "it"]),
    namespaces: new Set(),
    namespaceAliases: new Map(),
  };
  collectImportedJestTestBindings(program, names);
  names.describes = collectJestDescribeNames(program);
  const moduleBindings = collectModuleShadowedNames(program, names);
  names.shadowedGlobals = moduleBindings.shadowedGlobals;
  collectExecutableJestTestAliases(program, names, moduleBindings.describes);
  for (const name of findInvalidJestTestAliases(program, names)) names.callbacks.delete(name);
  return names;
}
