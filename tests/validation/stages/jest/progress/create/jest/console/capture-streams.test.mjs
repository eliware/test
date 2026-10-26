import { expect, test } from "@jest/globals";
import { createJestOutputCapture } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/capture-streams.mjs";

test("captures supported streams in arrival order", () => {
  const capture = createJestOutputCapture({ maxLength: 20 });
  expect(capture.append("stdout", "first")).toBe("first");
  expect(capture.append("stderr", "second")).toBe("second");
  expect(capture.snapshot()).toEqual({
    output: { stdout: ["first"], stderr: ["second"] },
    captured: "firstsecond",
    truncated: false,
  });
});

test("ignores unsupported streams and empty chunks", () => {
  const capture = createJestOutputCapture({ maxLength: 20 });
  expect(capture.append("other", "ignored")).toBe("");
  expect(capture.append("stdout", "")).toBe("");
  expect(capture.snapshot()).toEqual({
    output: { stdout: [], stderr: [] },
    captured: "",
    truncated: false,
  });
});

test("truncates at the limit and ignores later chunks", () => {
  const capture = createJestOutputCapture({ maxLength: 3 });
  expect(capture.append("stdout", "1234")).toBe("123");
  expect(capture.snapshot()).toEqual({
    output: { stdout: ["123"], stderr: [] },
    captured: "123",
    truncated: true,
  });
  expect(capture.append("stderr", "later")).toBe("");
});
