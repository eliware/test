import { expect, test } from "@jest/globals";
import isJestGlobalsImport from "../../../../src/checks/application/E-0.1.4.1.2/jest-globals-import.mjs";
test("recognizes direct and awaited Jest globals imports", () => {
  const source = {
    type: "StringLiteral",
    value: "@jest/globals",
  };
  expect(
    isJestGlobalsImport({
      type: "ImportExpression",
      source,
    }),
  ).toBe(true);
  expect(
    isJestGlobalsImport({
      type: "AwaitExpression",
      argument: {
        type: "ImportExpression",
        source,
      },
    }),
  ).toBe(true);
  expect(
    isJestGlobalsImport({
      type: "ImportExpression",
      source: {
        type: "StringLiteral",
        value: "other",
      },
    }),
  ).toBe(false);
});
