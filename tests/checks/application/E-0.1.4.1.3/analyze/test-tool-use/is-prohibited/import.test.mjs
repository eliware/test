import { expect, test } from "@jest/globals";
import isProhibitedTestToolImport from "../../../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use/is-prohibited/import.mjs";

test("recognizes prohibited test tool imports", () => {
  expect(
    isProhibitedTestToolImport(
      {
        type: "ImportDeclaration",
        source: {
          type: "StringLiteral",
          value: "jest",
        },
      },
      new Map(),
      false,
    ),
  ).toBe(true);
});

test("allows the harness instrumentation exception", () => {
  expect(
    isProhibitedTestToolImport(
      {
        type: "ImportDeclaration",
        source: {
          type: "StringLiteral",
          value: "istanbul-lib-instrument",
        },
      },
      new Map(),
      true,
    ),
  ).toBe(false);
  expect(
    isProhibitedTestToolImport(
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require" },
        arguments: [{ type: "Identifier", name: "dynamicName" }],
      },
      new Map(),
      false,
    ),
  ).toBe(false);
});

test("recognizes test runner module loading", () => {
  expect(
    isProhibitedTestToolImport(
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require" },
        arguments: [{ type: "StringLiteral", value: "jest" }],
      },
      new Map(),
      false,
    ),
  ).toBe(true);
  expect(
    isProhibitedTestToolImport(
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "require" },
        arguments: [{ type: "StringLiteral", value: "fs" }],
      },
      new Map(),
      false,
    ),
  ).toBe(false);
});
