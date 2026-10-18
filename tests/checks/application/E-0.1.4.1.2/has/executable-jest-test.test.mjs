import { expect, test } from "@jest/globals";
import { inspectJestTestModule } from "../../../../../src/checks/application/E-0.1.4.1.2/has/executable-jest-test.mjs";

test("parses source before inspecting an executable Jest test", () => {
  expect(inspectJestTestModule('test("valid", () => {});')).toEqual({ hasExecutableTest: true });
});

test("returns no executable test when source cannot be parsed", () => {
  expect(inspectJestTestModule("test(;")).toEqual({ hasExecutableTest: false });
});
