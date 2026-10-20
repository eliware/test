import { expect, test } from "@jest/globals";
import { writeDebugTiming } from "../../../src/cli/write/debug-timing.mjs";

test("writes timing only when enabled", () => {
  const output = [];
  writeDebugTiming((message) => output.push(message), 995, true);
  expect(output).toHaveLength(1);
  expect(output[0]).toMatch(/^Validation time: \d+ms\n$/);
  writeDebugTiming((message) => output.push(message), 1000, false);
  expect(output).toHaveLength(1);
});
