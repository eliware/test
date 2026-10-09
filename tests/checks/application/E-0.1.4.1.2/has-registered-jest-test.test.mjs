import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { hasRegisteredJestTest } from "../../../../src/checks/application/E-0.1.4.1.2/has-registered-jest-test.mjs";

const names = { callbacks: new Set(["test", "it"]), namespaces: new Set() };

test("counts module and describe registrations only", () => {
  const unused = parse('function unused() { test("fake", () => {}); }', { sourceType: "module" });
  expect(
    hasRegisteredJestTest(unused.program, {
      names,
      callbackNames: new Set(),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(false);
  const suite = parse('describe("suite", () => { test("real", () => {}); });', {
    sourceType: "module",
  });
  expect(
    hasRegisteredJestTest(suite.program, {
      names,
      callbackNames: new Set(),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(true);
});

test("rejects a describe callback that shadows the Jest test function", () => {
  const ast = parse('describe("suite", (test) => test("fake", () => {}));', {
    sourceType: "module",
  });
  expect(
    hasRegisteredJestTest(ast.program, {
      names,
      callbackNames: new Set(["test"]),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(false);
});

test("rejects calls that shadow a Jest namespace or use a missing suite callback", () => {
  const shadowed = parse('describe("suite", (jestApi) => jestApi.test("fake", () => {}));', {
    sourceType: "module",
  });
  expect(
    hasRegisteredJestTest(shadowed.program, {
      names: { callbacks: new Set(), namespaces: new Set(["jestApi"]) },
      callbackNames: new Set(),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(false);
  const missingCallback = parse('describe("suite", missing);', { sourceType: "module" });
  expect(
    hasRegisteredJestTest(missingCallback.program, {
      names,
      callbackNames: new Set(),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(false);
});

test("accepts a suite callback with an unrelated parameter", () => {
  const ast = parse('describe("suite", (unused) => test("real", () => {}));', {
    sourceType: "module",
  });
  expect(
    hasRegisteredJestTest(ast.program, {
      names,
      callbackNames: new Set(),
      blockedTests: new Set(),
      blockedCallbacks: new Set(),
    }),
  ).toBe(true);
});
