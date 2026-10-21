import { expect, test } from "@jest/globals";
import { isTestToolSpecifier } from "../../../../src/checks/application/E-0.1.4.1.3/test-tool-patterns.mjs";

test("recognizes test tools and excludes the Jest globals package", () => {
  expect(isTestToolSpecifier("@jest/core")).toBe(true);
  expect(isTestToolSpecifier("@jest/globals")).toBe(false);
  expect(isTestToolSpecifier("node:test")).toBe(true);
  expect(isTestToolSpecifier("node:fs")).toBe(false);
});
