import { expect, test } from "@jest/globals";
import { appendBoundedOutput, MAX_PROCESS_OUTPUT_LENGTH } from "../../../../../src/checks/general/E-1/E-1.20/bound-process-output.mjs";

test("appends output without truncation under the limit", () => {
  expect(appendBoundedOutput("a", "b", 4)).toBe("ab");
  expect(appendBoundedOutput("a", "b")).toBe("ab");
  expect(MAX_PROCESS_OUTPUT_LENGTH).toBe(100_000);
});

test("bounds output and marks truncation", () => {
  expect(appendBoundedOutput("abc", "def", 4)).toBe("abc…");
  expect(appendBoundedOutput("abc", "def", 0)).toBe("…");
});
