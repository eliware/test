import { expect, test } from "@jest/globals";
import { createIncrementalSearchWindow } from "../../../../../../../src/validation/shared/output/redaction/create/incremental/search-window.mjs";

test("tracks appended text and advances its absolute buffer window", () => {
  const window = createIncrementalSearchWindow(["secret"]);
  expect(window.appendedText("safe ")).toEqual({ text: "safe ", suppressed: false });
  expect(window.applyMatches([], 5, false)).toMatchObject({ boundary: 0, suppressed: false });
  window.rememberPending("safe ", 0);
  expect(window.appendedText("safe secret")).toEqual({ text: "secret", suppressed: false });
  expect(window.applyMatches([{ start: 5, end: 11 }], 11, false)).toMatchObject({
    boundary: 5,
    suppressed: false,
  });
  expect(window.bufferStart).toBe(5);
});

test("suppresses pending text that does not preserve the retained window", () => {
  const window = createIncrementalSearchWindow(["abc"]);
  window.rememberPending("abc", 1);
  expect(window.appendedText("ax")).toEqual({ text: "", suppressed: true });
});
