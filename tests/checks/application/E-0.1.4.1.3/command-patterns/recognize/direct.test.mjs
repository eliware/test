import { expect, test } from "@jest/globals";
import { isDirectTestCommand } from "../../../../../../src/checks/application/E-0.1.4.1.3/command-patterns/recognize/direct.mjs";

const runners = ["jest", "vitest"];

test("recognizes direct runner commands", () => {
  expect(isDirectTestCommand("jest --runInBand", runners)).toBe(true);
  expect(isDirectTestCommand("vitest.cmd run", runners)).toBe(true);
  expect(isDirectTestCommand("node_modules/.bin/jest --runInBand", runners)).toBe(true);
  expect(isDirectTestCommand("./node_modules/.bin/vitest/vitest.mjs run", runners)).toBe(true);
  expect(isDirectTestCommand("node node_modules/.bin/vitest/vitest.mjs run", runners)).toBe(true);
});

test("does not match ordinary text or unrelated binaries", () => {
  expect(isDirectTestCommand("echo jest", runners)).toBe(false);
  expect(isDirectTestCommand("node_modules/.bin/eslint", runners)).toBe(false);
});
