import { expect, jest, test } from "@jest/globals";
import { createJestProcessOptions } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-process-options.mjs";

test("assembles the Jest process configuration and forwards timeout diagnostics", () => {
  const onTimeout = jest.fn();
  const options = createJestProcessOptions("C:/fixture", [], {
    env: { NODE_OPTIONS: "--no-warnings" },
    onTimeout,
  });

  expect(options).toMatchObject({
    cwd: "C:/fixture",
    progressPattern: /^\[eliware-test-progress\]/m,
    progressTimeoutMs: 15_000,
    env: { NODE_OPTIONS: "--no-warnings --experimental-vm-modules" },
  });
  options.onProgress("[eliware-test-progress] start tests/example.test.mjs\n");
  options.onTimeout();
  expect(onTimeout).toHaveBeenCalledWith(
    "Test suite tests/example.test.mjs timed out after 15 seconds without progress.",
  );
});

test("enables expanded output and forwards stderr callback in debug mode", () => {
  const onStderr = jest.fn();
  const options = createJestProcessOptions("C:/fixture", ["--debug-timing"], { onStderr });

  expect(options.maxOutputLength).toBe(1_000_000);
  expect(options.onStderr).toBe(onStderr);
});

test("supports omitted options and optional timeout callbacks", () => {
  const options = createJestProcessOptions("C:/fixture");

  expect(options.cwd).toBe("C:/fixture");
  expect(options.maxOutputLength).toBeUndefined();
  expect(() => options.onTimeout()).not.toThrow();
});
