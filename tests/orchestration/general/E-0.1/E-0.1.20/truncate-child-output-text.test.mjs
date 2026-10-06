import { expect, test } from "@jest/globals";
import { truncateChildOutputText } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/truncate-child-output-text.mjs";

test.each([
  ["ordinary text", 3, "ord"],
  ["A😀B", 2, "A"],
  ["A😀B", 3, "A😀"],
  ["text", 0, ""],
])("truncates %p at a safe UTF-16 boundary", (text, limit, expected) => {
  expect(truncateChildOutputText(text, limit)).toBe(expected);
});
