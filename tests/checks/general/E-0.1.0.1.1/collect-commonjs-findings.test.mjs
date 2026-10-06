import { expect, test } from "@jest/globals";
import { collectCommonJsFindings } from "../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs-findings.mjs";

test("finds CommonJS calls, exports, identifiers, and import.meta.require", () => {
  const ast = {
    type: "Program",
    body: [
      { type: "CallExpression", callee: { type: "Identifier", name: "require" } },
      { type: "OptionalCallExpression", callee: { type: "Identifier", name: "require" } },
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

test("finds computed module exports and require member calls", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        {
          type: "MemberExpression",
          object: { type: "Identifier", name: "module" },
          property: { type: "StringLiteral", value: "exports" },
        },
        {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "require" },
            property: { type: "Identifier", name: "resolve" },
          },
        },
      ],
    },
    findings,
    "source.mts",
  );
  expect(findings).toEqual(["source.mts: CommonJS export", "source.mts: require()"]);
});

test("finds module.require calls", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "module" },
        property: { type: "StringLiteral", value: "require" },
      },
    },
    findings,
    "source.mjs",
  );
  expect(findings).toEqual(["source.mjs: module.require()"]);
});

test("finds CommonJS require aliases and TypeScript module syntax", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        { type: "VariableDeclarator", init: { type: "Identifier", name: "require" } },
        {
          type: "TSImportEqualsDeclaration",
          moduleReference: { type: "TSExternalModuleReference" },
        },
        { type: "TSExportAssignment" },
      ],
    },
    findings,
    "source.mts",
  );
  expect(findings).toEqual([
    "source.mts: require alias",
    "source.mts: TypeScript CommonJS module syntax",
    "source.mts: TypeScript CommonJS module syntax",
  ]);
});
