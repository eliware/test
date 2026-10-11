import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findRegisteredJestTest } from "../../../../src/checks/application/E-0.1.4.1.2/find-registered-jest-test.mjs";

test("finds registered callbacks inside active Jest suites", () => {
  const program = parse('describe("suite", () => { test("case", () => {}); });', {
    sourceType: "module",
  }).program;
  const bindings = {
    names: { callbacks: new Set(["test"]), namespaces: new Set() },
    callbackNames: new Set(),
    blockedTests: new Set(),
    blockedCallbacks: new Set(),
  };

  expect(findRegisteredJestTest(program, bindings)).toBe(true);
});
