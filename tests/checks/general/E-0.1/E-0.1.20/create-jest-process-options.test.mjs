import { expect, jest, test } from "@jest/globals";
import { createJestProcessOptions } from "../../../../../src/checks/general/E-0.1/E-0.1.20/create-jest-process-options.mjs";

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
  expect(options.maxOutputLength).toBe(1_000_000);
  options.onStderr("[eliware-test-progress] start suite\n[eliware-test] Running suite...\n");
  expect(output).toEqual(["[eliware-test-progress] start suite\n[eliware-test] Running suite...\n"]);
});

test("passes a defensive copy of the complete subprocess environment", () => {
  const secretKey = ["SECRET", "TOKEN"].join("_");
  const original = process.env[secretKey];
  process.env[secretKey] = "preserved-for-child";
  const options = createJestProcessOptions("C:/fixture");
  expect(options.env.PATH ?? options.env.Path).toBeTruthy();
  expect(options.env.NODE_OPTIONS).toContain("--experimental-vm-modules");
  expect(options.env[secretKey]).toBe("preserved-for-child");
  expect(process.env[secretKey]).toBe("preserved-for-child");
  if (original === undefined) delete process.env[secretKey];
  else process.env[secretKey] = original;
});

test("preserves already configured Node runtime options", () => {
  const previous = process.env.NODE_OPTIONS;
  process.env.NODE_OPTIONS = "--experimental-vm-modules --no-warnings";
  try {
    const options = createJestProcessOptions("C:/fixture");
    expect(options.env.NODE_OPTIONS).toBe(process.env.NODE_OPTIONS);
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

test("adds required Node runtime options when none are configured", () => {
  const previous = process.env.NODE_OPTIONS;
  delete process.env.NODE_OPTIONS;
  try {
    const options = createJestProcessOptions("C:/fixture");
    expect(options.env.NODE_OPTIONS).toBe("--experimental-vm-modules --no-warnings");
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
});

test("builds the child environment from the invoking environment", () => {
  const options = createJestProcessOptions("C:/fixture", [], { env: { NODE_OPTIONS: "--trace-warnings", TOKEN: "provided" } });
  expect(options.env).toEqual({
    NODE_OPTIONS: "--trace-warnings --experimental-vm-modules",
    TOKEN: "provided",
  });
});
