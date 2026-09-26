import { expect, test } from "@jest/globals";
import { classifyCall, rootIdentifier } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-call-analysis.mjs";

const identifier = (name) => ({ type: "Identifier", name });
const call = (callee, type = "CallExpression") => ({ type, callee, arguments: [] });
const imports = (overrides = {}) => ({
  names: new Map(),
  namespaces: new Set(),
  sideEffectNamespaces: new Set(),
  ...overrides,
});

test("classifies directly imported and namespace subprocess functions", () => {
  const direct = classifyCall(call(identifier("spawn")), imports({ names: new Map([["spawn", "spawn"]]) }));
  expect(direct.isSubprocess).toBe(true);
  expect(direct.isUnsupported).toBe(false);

  const namespace = classifyCall(
    call({ type: "MemberExpression", object: identifier("child"), property: identifier("execFileSync") }),
    imports({ namespaces: new Set(["child"]) }),
  );
  expect(namespace.isSubprocess).toBe(true);
  expect(rootIdentifier({ type: "MemberExpression", object: { type: "MemberExpression", object: identifier("child") } })).toBe("child");
  expect(rootIdentifier(identifier("spawn"))).toBe("spawn");
  expect(rootIdentifier(null)).toBeUndefined();
});

test("identifies side-effect imports and unsupported calls", () => {
  const directSideEffect = classifyCall(
    call(identifier("remove")),
    imports({ names: new Map([["remove", "node:fs:rm"]]) }),
  );
  expect(directSideEffect.isSideEffect).toBe(true);

  const namespaceSideEffect = classifyCall(
    call({ type: "MemberExpression", object: identifier("fs"), property: identifier("rm") }),
    imports({ sideEffectNamespaces: new Set(["fs"]) }),
  );
  expect(namespaceSideEffect.isSideEffect).toBe(true);

  expect(classifyCall(call(identifier("unknown")), imports()).isUnsupported).toBe(true);
  expect(classifyCall(call({ type: "MemberExpression", object: identifier("object"), property: identifier("run") }), imports()).isUnsupported).toBe(true);
});

test("allows imported namespace calls and process.cwd while rejecting dynamic execution", () => {
  const namespaceCall = call({
    type: "MemberExpression",
    object: { type: "MemberExpression", object: identifier("child"), property: identifier("nested") },
    property: identifier("spawnSync"),
  });
  expect(classifyCall(namespaceCall, imports({ namespaces: new Set(["child"]) })).isUnsupported).toBe(false);
  expect(classifyCall(call({ type: "MemberExpression", object: identifier("process"), property: identifier("cwd") }), imports()).isUnsupported).toBe(false);
  expect(classifyCall(call({ type: "Import" }), imports()).isDynamic).toBe(true);
  expect(classifyCall(call(identifier("require")), imports()).isDynamic).toBe(true);
  expect(classifyCall(call(identifier("eval")), imports()).isDynamic).toBe(true);
  expect(classifyCall({ type: "Identifier", name: "value" }, imports()).isDynamic).toBe(false);
});
