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
  collectCommonJsFindings(null, findings, "source.mts");
  collectCommonJsFindings({ type: "Program", loc: {}, start: 0, end: 1 }, findings, "source.mts");
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
        {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "module" },
            property: { type: "StringLiteral", value: "require" },
          },
        },
      ],
    },
    findings,
    "source.mts",
  );
  expect(findings).toEqual([
    "source.mts: CommonJS export",
    "source.mts: require()",
    "source.mts: module.require()",
  ]);
});

test("finds CommonJS require aliases and TypeScript module syntax", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        null,
        { type: "VariableDeclarator", init: { type: "Identifier", name: "unrelated" } },
        { type: "AssignmentExpression", left: {}, right: { type: "Identifier", name: "other" } },
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

test("finds aliased require functions and computed module exports", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: "load" },
          init: { type: "Identifier", name: "require" },
        },
        { type: "CallExpression", callee: { type: "Identifier", name: "load" } },
        {
          type: "AssignmentExpression",
          left: {
            type: "MemberExpression",
            computed: true,
            object: { type: "Identifier", name: "module" },
            property: { type: "Identifier", name: "exportKey" },
          },
        },
      ],
    },
    findings,
    "source.mjs",
  );
  expect(findings).toContain("source.mjs: require()");
  expect(findings).toContain("source.mjs: CommonJS export");
});

test("finds exports through a destructured module alias", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        {
          type: "VariableDeclarator",
          id: {
            type: "ObjectPattern",
            properties: [{ key: { name: "exports" }, value: { name: "out" } }],
          },
          init: { type: "Identifier", name: "module" },
        },
        {
          type: "AssignmentExpression",
          left: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "out" },
            property: { type: "Identifier", name: "value" },
          },
          right: { type: "NumericLiteral", value: 1 },
        },
      ],
    },
    findings,
    "source.mjs",
  );
  expect(findings).toContain("source.mjs: CommonJS export");
});

test("finds exports forwarded through module.exports aliases", () => {
  const findings = [];
  collectCommonJsFindings(
    {
      type: "Program",
      body: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: "out" },
          init: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "module" },
            property: { type: "Identifier", name: "exports" },
          },
        },
        {
          type: "MemberExpression",
          object: { type: "Identifier", name: "out" },
          property: { type: "Identifier", name: "value" },
        },
      ],
    },
    findings,
    "source.mjs",
  );
  expect(findings).toContain("source.mjs: CommonJS export");
});
