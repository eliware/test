import { expect, jest, test } from "@jest/globals";
import { createProgressLineBuffer } from "../../../../src/validation/shared/process/create-progress-line-buffer.mjs";

test("joins split text and reports complete lines", () => {
  const onLine = jest.fn();
  const progress = createProgressLineBuffer({ onLine });
  progress.push("progress");
  progress.push(" ready\nnext\n");
  progress.flush();
  expect(onLine.mock.calls.map(([line]) => line)).toEqual(["progress ready", "next", ""]);
});

test("ignores overlong lines and resumes at the next line", () => {
  const lines = [];
  const progress = createProgressLineBuffer({
    onLine: (line) => lines.push(line),
    maxLineLength: 4,
  });
  progress.push("12345");
  progress.push("678\nokay\n");
  progress.flush();
  expect(lines).toEqual(["okay", ""]);
});

test("ignores a complete line that exceeds the configured size", () => {
  const onLine = jest.fn();
  const progress = createProgressLineBuffer({ onLine, maxLineLength: 4 });
  progress.push("12345\n");
  progress.flush();
  expect(onLine).toHaveBeenCalledWith("");
  expect(onLine).not.toHaveBeenCalledWith("12345");
});

test("drops further chunks until an overlong line ends", () => {
  const onLine = jest.fn();
  const progress = createProgressLineBuffer({ onLine, maxLineLength: 4 });
  progress.push("12345");
  progress.push("678");
  progress.flush();
  expect(onLine).not.toHaveBeenCalled();
});

test("allows unlimited line lengths when requested", () => {
  const onLine = jest.fn();
  const progress = createProgressLineBuffer({ onLine, maxLineLength: Infinity });
  progress.push("x".repeat(5000));
  progress.flush();
  expect(onLine).toHaveBeenCalledWith("x".repeat(5000));
});

test("reports decoded text and flushes a final line", () => {
  const onText = jest.fn();
  const onLine = jest.fn();
  const progress = createProgressLineBuffer({ onLine, onText });
  progress.push(Buffer.from("last"));
  progress.flush();
  expect(onText).toHaveBeenCalledWith("last");
  expect(onLine).toHaveBeenCalledWith("last");
});

test("handles an empty final line and invalid callback options", () => {
  const progress = createProgressLineBuffer({ onLine: () => {} });
  expect(() => progress.push("")).not.toThrow();
  expect(() => progress.push(null)).not.toThrow();
  expect(() => progress.flush()).not.toThrow();
});
