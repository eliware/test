import { expect, test } from "@jest/globals";
import { collectCommonJsFindings } from "../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs-findings.mjs";

test("finds CommonJS calls, exports, identifiers, and import.meta.require", () => {
  const ast = {
    type: "Program",
    body: [
      { type: "CallExpression", callee: { type: "Identifier", name: "require" } },
      {
        type: "MemberExpression",
        object: { type: "Identifier", name: "module" },
        property: { type: "Identifier", name: "exports" },
      },
      {
        type: "MemberExpression",
        object: { type: "Identifier", name: "exports" },
        property: { type: "Identifier", name: "value" },
      },
      { type: "Identifier", name: "__dirname" },
      { type: "Identifier", name: "__filename" },
      {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: { type: "MetaProperty", meta: { name: "import" } },
          property: { type: "Identifier", name: "require" },
        },
      },
    ],
  };
  const findings = [];
  collectCommonJsFindings(ast, findings, "source.mjs");
  expect(findings).toEqual([
    "source.mjs: require()",
    "source.mjs: CommonJS export",
    "source.mjs: CommonJS export",
    "source.mjs: CommonJS identifier __dirname",
    "source.mjs: CommonJS identifier __filename",
    "source.mjs: import.meta.require()",
  ]);
});

test("ignores null nodes and location metadata", () => {
  const findings = [];
  collectCommonJsFindings(null, findings, "file.mjs");
  collectCommonJsFindings(
    { type: "Program", loc: { name: "require" }, start: 0, end: 1 },
    findings,
    "file.mjs",
  );
  expect(findings).toEqual([]);
});
