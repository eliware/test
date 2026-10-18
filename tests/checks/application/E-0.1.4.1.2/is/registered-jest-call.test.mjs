import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  isSkippedJestSuiteCall,
  isRegisteredJestSuiteCall,
  isRegisteredJestTestCall,
} from "../../../../../src/checks/application/E-0.1.4.1.2/is/registered-jest-call.mjs";

function call(source) {
  return parse(source, { sourceType: "module" }).program.body[0].expression;
}

test("accepts active Jest test calls with functions or known callback names", () => {
  const names = { callbacks: new Set(["test"]), namespaces: new Set() };
  expect(
    isRegisteredJestTestCall(
      call('test("one", () => {});'),
      names,
      new Set(),
      new Set(),
      new Set(),
    ),
  ).toBe(true);
  expect(
    isRegisteredJestTestCall(
      call('test("two", verify);'),
      names,
      new Set(["verify"]),
      new Set(),
      new Set(),
    ),
  ).toBe(true);
});

test("rejects inactive tests and blocked suite names", () => {
  const names = { callbacks: new Set(["test"]), namespaces: new Set() };
  expect(
    isRegisteredJestTestCall(call('test("bad", 42);'), names, new Set(), new Set(), new Set()),
  ).toBe(false);
  expect(
    isRegisteredJestTestCall(
      call('test("blocked callback", verify);'),
      names,
      new Set(["verify"]),
      new Set(),
      new Set(["verify"]),
    ),
  ).toBe(false);
  expect(
    isRegisteredJestTestCall(
      call('test("blocked", () => {});'),
      { callbacks: new Set(["test"]), namespaces: new Set() },
      new Set(),
      new Set(["test"]),
      new Set(),
    ),
  ).toBe(false);
  expect(
    isRegisteredJestSuiteCall(
      call('describe("named", verify);'),
      new Set(["describe"]),
      new Set(),
      new Set(["verify"]),
    ),
  ).toBe(true);
  expect(
    isRegisteredJestSuiteCall(
      call('describe("fake", () => {});'),
      new Set(["describe"]),
      new Set(["describe"]),
      new Set(),
    ),
  ).toBe(false);
});

test("accepts active suites with function callbacks", () => {
  expect(
    isRegisteredJestSuiteCall(
      call('describe("suite", () => {});'),
      new Set(["describe"]),
      new Set(),
      new Set(),
    ),
  ).toBe(true);
});

test("accepts computed suite modifiers", () => {
  expect(
    isRegisteredJestSuiteCall(
      call('describe["only"]("suite", () => {});'),
      new Set(["describe"]),
      new Set(),
      new Set(),
    ),
  ).toBe(true);
  expect(
    isSkippedJestSuiteCall(call('describe["skip"]("suite", () => {});'), new Set(["describe"])),
  ).toBe(true);
});
