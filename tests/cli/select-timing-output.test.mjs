import { expect, jest, test } from "@jest/globals";
import { selectTimingOutput } from "../../src/cli/select-timing-output.mjs";

test("disables timing output unless debug timing is enabled", () => {
  expect(selectTimingOutput([], jest.fn())).toBeUndefined();
});

test("uses stdout for the default logger and the supplied writer otherwise", () => {
  const stdout = { write: jest.fn() };
  const write = jest.fn();
  expect(selectTimingOutput(["--debug-timing"], console.log, stdout)).toBeDefined();
  expect(selectTimingOutput(["--debug-timing"], write, stdout)).toBe(write);
});
