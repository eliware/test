import { expect, test } from "@jest/globals";
import { isTestToolCommand } from "../../../../src/checks/application/E-0.1.4.1.3/command-patterns.mjs";

test("recognizes test commands in shell command sequences", () => {
  expect(isTestToolCommand("echo ready && jest --runInBand")).toBe(true);
  expect(isTestToolCommand("echo vitest run")).toBe(false);
  expect(isTestToolCommand("echo 'safe | jest'")).toBe(false);
  expect(isTestToolCommand("echo 'safe | jest' && jest --runInBand")).toBe(true);
  expect(isTestToolCommand('sh -c "vitest run"')).toBe(true);
});

test("does not classify Jest itself as a test tool in the harness", () => {
  expect(isTestToolCommand("jest --runInBand", true)).toBe(false);
  expect(isTestToolCommand("vitest run", true)).toBe(true);
});
