import { expect, test } from "@jest/globals";
import { writeDebugTiming } from "../../src/cli/write-debug-timing.mjs";

test("writes timing only when enabled", () => {
  const output = [];
  writeDebugTiming((message) => output.push(message), Date.now() - 5, true);
  expect(output).toHaveLength(1);
  expect(output[0]).toMatch(/^Validation time: \d+ms$/);
  writeDebugTiming((message) => output.push(message), Date.now(), false);
  expect(output).toHaveLength(1);
});
