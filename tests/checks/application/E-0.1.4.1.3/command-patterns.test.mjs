import { expect, test } from "@jest/globals";
import { isTestToolCommand } from "../../../../src/checks/application/E-0.1.4.1.3/command-patterns.mjs";

test("recognizes test commands without matching ordinary text", () => {
  expect(isTestToolCommand("node_modules/.bin/jest --runInBand")).toBe(true);
  expect(isTestToolCommand("./node_modules/.bin/vitest/vitest.mjs run")).toBe(true);
  expect(isTestToolCommand("node node_modules/.bin/vitest/vitest.mjs run")).toBe(true);
  expect(isTestToolCommand("node.exe --experimental-test-coverage --test")).toBe(true);
  expect(isTestToolCommand("bun test src")).toBe(true);
  expect(isTestToolCommand("node --version")).toBe(false);
  expect(isTestToolCommand("echo vitest run")).toBe(false);
  expect(isTestToolCommand('sh -c "vitest run"')).toBe(true);
  expect(isTestToolCommand("npm exec --package=jest -- jest")).toBe(true);
  expect(isTestToolCommand("jest --runInBand", true)).toBe(false);
});
