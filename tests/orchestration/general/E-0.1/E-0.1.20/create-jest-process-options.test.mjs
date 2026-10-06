import { expect, jest, test } from "@jest/globals";
import { createJestProcessOptions } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/create-jest-process-options.mjs";

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
    suiteTimeoutMs: 5_000,
    env: { NODE_OPTIONS: "--no-warnings --experimental-vm-modules" },
  });
  expect(options.resetOnAnyOutput).toBeUndefined();
  expect(options.maxOutputLength).toBe(1_000_000);
  options.onProgress('[eliware-test-progress] {"event":"start","path":"tests/example.test.mjs"}\n');
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

test("reports the suite that exceeds the five second limit", () => {
  const onTimeout = jest.fn();
  const options = createJestProcessOptions("C:/fixture", [], { onTimeout });
  options.onSuiteTimeout("tests/slow.test.mjs");
  expect(onTimeout).toHaveBeenCalledWith(
    "Test suite tests/slow.test.mjs exceeded its 5 second maximum runtime.",
  );
});

test("streams concise suite progress and separates it from the enclosing check line", () => {
  const output = [];
  const beginNestedOutput = jest.fn();
  const options = createJestProcessOptions("C:/fixture", [], {
    writeOutput: (text) => output.push(text),
    beginNestedOutput,
  });
  options.onProgress('[eliware-test-progress] {"event":"start","path":"tests/a.test.mjs"}\n');
  options.onProgress(
    '[eliware-test-progress] {"event":"result","path":"tests/a.test.mjs","duration":"0.212","failed":false}\n',
  );

  expect(beginNestedOutput).toHaveBeenCalledTimes(1);
  expect(output.join("")).toBe("Running tests/a.test.mjs... PASS - 0.212s\n");
  expect(options.maxProgressLineLength).toBe(Number.MAX_SAFE_INTEGER);
});

test("passes the run-scoped console report path to Jest's reporter", () => {
  const options = createJestProcessOptions("C:/fixture", [], {
    consoleReportFile: "C:/fixture/coverage/jest-console-output.json",
  });

  expect(options.env.ELIWARE_TEST_JEST_CONSOLE_REPORT).toBe(
    "C:/fixture/coverage/jest-console-output.json",
  );
});

test("supports omitted options and optional timeout callbacks", () => {
  const options = createJestProcessOptions("C:/fixture");

  expect(options.cwd).toBe("C:/fixture");
  expect(options.maxOutputLength).toBe(1_000_000);
  expect(() => options.onTimeout()).not.toThrow();
});

test("uses the supplied consumer repository root as Jest's working directory", () => {
  const root = "C:/consumer repository";
  expect(createJestProcessOptions(root).cwd).toBe(root);
});
