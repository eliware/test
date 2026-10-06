import { expect, test } from "@jest/globals";
import {
  isJestGlobalsImport,
  isTestNamespace,
} from "../../../../src/checks/application/E-0.1.4.1.2/jest-globals-import.mjs";

test("recognizes direct and awaited Jest globals imports", () => {
  const source = { type: "StringLiteral", value: "@jest/globals" };
  expect(isJestGlobalsImport({ type: "ImportExpression", source })).toBe(true);
  expect(
    isJestGlobalsImport({
      type: "AwaitExpression",
      argument: { type: "ImportExpression", source },
    }),
  ).toBe(true);
  expect(
    isJestGlobalsImport({
      type: "ImportExpression",
      source: { type: "StringLiteral", value: "other" },
    }),
  ).toBe(false);
});

test("recognizes Jest global namespace identifiers", () => {
  const names = { namespaces: new Set(["jest"]) };
  expect(isTestNamespace({ type: "Identifier", name: "jest" }, names)).toBe(true);
  expect(isTestNamespace({ type: "Identifier", name: "globalThis" }, names)).toBe(true);
  expect(isTestNamespace({ type: "Identifier", name: "other" }, names)).toBe(false);
});
