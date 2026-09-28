import { expect, test } from "@jest/globals";
import {
  classifyCall,
  rootIdentifier,
} from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-call-analysis.mjs";

const identifier = (name) => ({ type: "Identifier", name });
const call = (callee) => ({ type: "CallExpression", callee, arguments: [] });

test("recognizes directly imported and namespace subprocess functions", () => {
  expect(
    classifyCall(call(identifier("run")), {
      names: new Map([["run", "spawnSync"]]),
      namespaces: new Set(),
    }).isSubprocess,
  ).toBe(true);

  expect(
    classifyCall(
      call({
        type: "MemberExpression",
        object: identifier("child"),
        property: identifier("execFileSync"),
      }),
      { names: new Map(), namespaces: new Set(["child"]) },
    ).isSubprocess,
  ).toBe(true);
});

test("identifies non-subprocess calls and resolves member roots", () => {
  expect(
    classifyCall(call(identifier("unknown")), {
      names: new Map(),
      namespaces: new Set(),
    }).isSubprocess,
  ).toBe(false);
  expect(
    rootIdentifier({
      type: "MemberExpression",
      object: { type: "MemberExpression", object: identifier("child") },
    }),
  ).toBe("child");
  expect(rootIdentifier(null)).toBeUndefined();
});

test("recognizes computed and optional subprocess members", () => {
  const computed = {
    type: "MemberExpression",
    object: identifier("child"),
    computed: true,
    property: { type: "StringLiteral", value: "spawnSync" },
  };
  expect(
    classifyCall(call(computed), {
      names: new Map(),
      namespaces: new Set(["child"]),
    }),
  ).toMatchObject({ member: "spawnSync", isSubprocess: true });

  expect(
    classifyCall(
      { ...call(identifier("run")), type: "OptionalCallExpression" },
      {
        names: new Map([["run", "execFile"]]),
        namespaces: new Set(),
      },
    ).isSubprocess,
  ).toBe(true);

  expect(
    classifyCall(
      { type: "NewExpression", callee: identifier("run") },
      {
        names: new Map([["run", "spawn"]]),
        namespaces: new Set(),
      },
    ).isSubprocess,
  ).toBe(false);
});
