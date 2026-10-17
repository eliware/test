import { expect, test } from "@jest/globals";
import {
  isTestToolCommand,
  isTestToolSpecifier,
} from "../../../../src/checks/application/E-0.1.4.1.3/test-tool-patterns.mjs";

test("recognizes test tools and excludes the Jest globals package", () => {
  expect(isTestToolSpecifier("@jest/core")).toBe(true);
  expect(isTestToolSpecifier("@jest/globals")).toBe(false);
  expect(isTestToolSpecifier("node:test")).toBe(true);
  expect(isTestToolSpecifier("node:fs")).toBe(false);
});

test("recognizes test commands without matching ordinary text", () => {
  expect(isTestToolCommand("node_modules/.bin/jest --runInBand")).toBe(true);
  expect(isTestToolCommand("node.exe --experimental-test-coverage --test")).toBe(true);
  expect(isTestToolCommand("bun test src")).toBe(true);
  expect(isTestToolCommand("node --version")).toBe(false);
});
