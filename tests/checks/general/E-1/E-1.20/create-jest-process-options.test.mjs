import { expect, jest, test } from "@jest/globals";
import { createJestProcessOptions } from "../../../../../src/checks/general/E-1/E-1.20/create-jest-process-options.mjs";

test("builds a quiet progress-aware Jest process configuration", () => {
  const onTimeout = jest.fn();
  const options = createJestProcessOptions("C:/fixture", ["--debug-timing"], { onTimeout });
  expect(options.cwd).toBe("C:/fixture");
  expect(options.progressTimeoutMs).toBe(15_000);
  options.onProgress("[eliware-test-progress] start tests/hanging.test.mjs\n");
  options.onProgress("[eliware-test-progress] test tests/hanging.test.mjs :: test 4 0.100s\n");
  options.onProgress("unrecognized progress text\n");
  options.onTimeout();
  expect(onTimeout).toHaveBeenCalledWith("Test suite tests/hanging.test.mjs :: test 4 timed out after 15 seconds without progress.");
});

test("uses defaults when optional arguments are omitted", () => {
  const options = createJestProcessOptions("C:/fixture");
  expect(options.progressTimeoutMs).toBe(15_000);
  options.onTimeout();
});

test("preserves machine progress for diagnostics and expands debug capture", () => {
  const output = [];
  const options = createJestProcessOptions("C:/fixture", ["--debug-timing"], { onStderr: (text) => output.push(text) });
  expect(options.maxOutputLength).toBe(10_000_000);
  options.onStderr("[eliware-test-progress] start suite\n[eliware-test] Running suite...\n");
  expect(output).toEqual(["[eliware-test-progress] start suite\n[eliware-test] Running suite...\n"]);
});
