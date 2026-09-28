import { expect, test } from "@jest/globals";
import {
  classifyCall,
  rootIdentifier,
} from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-call-analysis.mjs";

const identifier = (name) => ({ type: "Identifier", name });
const call = (callee, type = "CallExpression") => ({ type, callee, arguments: [] });
const imports = (overrides = {}) => ({
  names: new Map(),
  namespaces: new Set(),
  sideEffectNamespaces: new Set(),
  ...overrides,
});

test("classifies directly imported and namespace subprocess functions", () => {
  const direct = classifyCall(
    call(identifier("spawn")),
    imports({ names: new Map([["spawn", "spawn"]]) }),
  );
  expect(direct.isSubprocess).toBe(true);
  expect(direct.isUnsupported).toBe(false);

  const namespace = classifyCall(
    call({
      type: "MemberExpression",
      object: identifier("child"),
      property: identifier("execFileSync"),
    }),
    imports({ namespaces: new Set(["child"]) }),
  );
  expect(namespace.isSubprocess).toBe(true);
  const computed = classifyCall(
    call({
      type: "MemberExpression",
      object: identifier("child"),
      property: { type: "StringLiteral", value: "spawnSync" },
      computed: true,
    }),
    imports({ namespaces: new Set(["child"]) }),
  );
  expect(computed.isSubprocess).toBe(true);
  expect(computed.isUnsupported).toBe(false);
  expect(
    rootIdentifier({
      type: "MemberExpression",
      object: { type: "MemberExpression", object: identifier("child") },
    }),
  ).toBe("child");
  expect(rootIdentifier(identifier("spawn"))).toBe("spawn");
  expect(rootIdentifier(null)).toBeUndefined();
});

test("classifies optional member chains as namespace subprocess calls", () => {
  const optional = classifyCall(
    call(
      {
        type: "OptionalMemberExpression",
        object: identifier("child"),
        property: identifier("spawnSync"),
        optional: true,
      },
      "OptionalCallExpression",
    ),
    imports({ namespaces: new Set(["child"]) }),
  );
  expect(optional.isSubprocess).toBe(true);
  expect(optional.isUnsupported).toBe(false);
  expect(
    rootIdentifier({
      type: "OptionalMemberExpression",
      object: identifier("child"),
      property: identifier("promises"),
      optional: true,
    }),
  ).toBe("child");
});

test("classifies aliases by their canonical child-process export", () => {
  const alias = classifyCall(
    call(identifier("runCommand")),
    imports({ names: new Map([["runCommand", "execSync"]]) }),
  );
  expect(alias.direct).toBe("execSync");
  expect(alias.isSubprocess).toBe(true);

  const unsupported = classifyCall(
    call(identifier("fork")),
    imports({ names: new Map([["fork", "node:child_process:fork"]]) }),
  );
  expect(unsupported.isSubprocess).toBe(false);
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
  expect(classifyCall(call(identifier("fetch")), imports()).isUnsupported).toBe(true);
  expect(
    classifyCall(
      call({ type: "MemberExpression", object: identifier("object"), property: identifier("run") }),
      imports(),
    ).isUnsupported,
  ).toBe(true);
  expect(
    classifyCall(call(identifier("fetch"), "OptionalCallExpression"), imports()).isUnsupported,
  ).toBe(true);
});

test("allows imported namespace calls and process.cwd while rejecting dynamic execution", () => {
  const namespaceCall = call({
    type: "MemberExpression",
    object: {
      type: "MemberExpression",
      object: identifier("child"),
      property: identifier("nested"),
    },
    property: identifier("spawnSync"),
  });
  expect(
    classifyCall(namespaceCall, imports({ namespaces: new Set(["child"]) })).isUnsupported,
  ).toBe(false);
  expect(
    classifyCall(
      call({
        type: "MemberExpression",
        object: identifier("process"),
        property: identifier("cwd"),
      }),
      imports(),
    ).isUnsupported,
  ).toBe(false);
  expect(classifyCall(call({ type: "Import" }), imports()).isDynamic).toBe(true);
  expect(
    classifyCall(
      call({
        type: "MemberExpression",
        object: identifier("child"),
        property: identifier("method"),
        computed: true,
      }),
      imports({ namespaces: new Set(["child"]) }),
    ).isUnsupported,
  ).toBe(true);
  expect(classifyCall(call(identifier("require")), imports()).isDynamic).toBe(true);
  expect(classifyCall(call(identifier("eval")), imports()).isDynamic).toBe(true);
  expect(
    classifyCall(
      call({
        type: "MemberExpression",
        object: { type: "MetaProperty" },
        property: { name: "require" },
      }),
      imports(),
    ).isDynamic,
  ).toBe(true);
  expect(classifyCall({ type: "Identifier", name: "value" }, imports()).isDynamic).toBe(false);
});
