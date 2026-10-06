import { expect, test } from "@jest/globals";
import { formatExitCode } from "../../src/cli/format-exit-code.mjs";

test("formats successful and failed CLI exit codes", () => {
  expect(formatExitCode(0)).toBe("Exit-code: 0");
  expect(formatExitCode(4)).toBe("Exit-code: 4 (coverage failure)");
  expect(formatExitCode(12)).toBe("Exit-code: 12 (convention failure)");
  expect(formatExitCode(99)).toBe("Exit-code: 99 (unclassified failure)");
});

test.each([
  [1, "unclassified or configuration failure"],
  [2, "Jest test failure"],
  [3, "unexpected test output"],
  [4, "coverage failure"],
  [5, "lint failure"],
  [6, "format failure"],
  [7, "npm audit failure"],
  [8, "npm outdated failure"],
  [9, "npm pack failure"],
  [10, "typecheck failure"],
  [11, "build failure"],
  [12, "convention failure"],
])("formats code %i with its unique meaning", (code, meaning) => {
  expect(formatExitCode(code)).toBe(`Exit-code: ${code} (${meaning})`);
});
