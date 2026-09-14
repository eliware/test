import { expect, test } from "@jest/globals";
import { classifyCall, rootIdentifier } from "../../../../../src/checks/general/E-1/E-1.10/knit-call-analysis.mjs";

test("classifies imported subprocess calls and member roots", () => {
  const node = { type: "CallExpression", callee: { type: "Identifier", name: "spawn" }, arguments: [] };
  const imports = { names: new Map([["spawn", "spawn"]]), namespaces: new Set(), sideEffectNamespaces: new Set() };
  expect(classifyCall(node, imports).isSubprocess).toBe(true);
  expect(rootIdentifier({ type: "MemberExpression", object: { type: "Identifier", name: "cp" } })).toBe("cp");
});
