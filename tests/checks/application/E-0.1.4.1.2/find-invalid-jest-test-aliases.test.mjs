import { expect, test } from "@jest/globals";
import { findInvalidJestTestAliases } from "../../../../src/checks/application/E-0.1.4.1.2/find-invalid-jest-test-aliases.mjs";

test("finds test callback aliases that receive non-test values", () => {
  const names = { callbacks: new Set(["test", "run"]), namespaces: new Set() };
  const program = {
    type: "Program",
    body: [
      {
        type: "AssignmentExpression",
        left: { type: "Identifier", name: "run" },
        right: { type: "ArrowFunctionExpression" },
      },
    ],
  };
  expect([...findInvalidJestTestAliases(program, names)]).toEqual(["run"]);
});

test("keeps test aliases assigned to another Jest callback", () => {
  const names = { callbacks: new Set(["test", "run"]), namespaces: new Set() };
  const program = {
    type: "Program",
    body: [
      {
        type: "AssignmentExpression",
        left: { type: "Identifier", name: "run" },
        right: { type: "Identifier", name: "test" },
      },
    ],
  };
  expect([...findInvalidJestTestAliases(program, names)]).toEqual([]);
});

test("ignores non-callback assignments and empty programs", () => {
  const names = { callbacks: new Set(["test"]), namespaces: new Set() };
  expect([...findInvalidJestTestAliases(null, names)]).toEqual([]);
  expect([...findInvalidJestTestAliases({ type: "Program", body: [] }, names)]).toEqual([]);
  expect([
    ...findInvalidJestTestAliases(
      {
        type: "AssignmentExpression",
        left: { type: "Identifier", name: "other" },
        right: { type: "NullLiteral" },
      },
      names,
    ),
  ]).toEqual([]);
});
