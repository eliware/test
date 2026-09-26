import { expect, test } from "@jest/globals";
import { formatExitCode } from "../../src/cli/format-exit-code.mjs";

test("formats successful and failed CLI exit codes", () => {
  expect(formatExitCode(0)).toBe("Exit-code: 0");
  expect(formatExitCode(10)).toBe("Exit-code: 10 (coverage failure)");
  expect(formatExitCode(99)).toBe("Exit-code: 99 (unclassified failure)");
});
