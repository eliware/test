import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const writes = [];
const originalWrite = process.stderr.write.bind(process.stderr);
const { default: JestProgressReporter } =
  await import("../../../../../src/orchestration/general/E-0.1/E-0.1.20/jest-progress-reporter.mjs");

function events(output) {
  return output.map((line) => JSON.parse(line.match(/^\[eliware-test-progress\] (.+)\n$/u)[1]));
}

beforeEach(() => {
  writes.length = 0;
  process.stderr.write = (value) => {
    writes.push(value);
    return true;
  };
});

afterEach(() => {
  process.stderr.write = originalWrite;
});

test("reports suite start and completion once without per-test output", () => {
  const reporter = new JestProgressReporter();
  reporter.onTestStart({ path: "tests/example.test.mjs" });
  reporter.onTestResult(
    { path: "tests/example.test.mjs" },
    { startTime: 100, endTime: 1_100, assertionResults: [{ fullName: "works", duration: 250 }] },
  );

  expect(events(writes)).toEqual([
    { event: "start", path: "tests/example.test.mjs" },
    {
      event: "result",
      path: "tests/example.test.mjs",
      duration: "1.000",
      failed: false,
      failures: [],
      unexpectedOutput: [],
    },
  ]);
});

test("includes suite failures and unexpected console output in its result", () => {
  const reporter = new JestProgressReporter();
  reporter.onTestResult(
    { path: "tests/failing.test.mjs" },
    {
      assertionResults: [
        { status: "failed", fullName: "case fails", failureMessages: ["Assertion failed"] },
      ],
      console: [{ type: "warn", message: "unexpected warning" }],
    },
  );

  expect(events(writes)[0]).toMatchObject({
    event: "result",
    failed: true,
    failures: ["case fails\nAssertion failed"],
    unexpectedOutput: ["console.warn: unexpected warning"],
  });
});

test("uses Jest performance statistics and test execution error stacks", () => {
  const reporter = new JestProgressReporter();
  reporter.onTestResult(
    { path: "tests/runtime-error.test.mjs" },
    {
      perfStats: { start: 100, end: 1_100 },
      testExecError: { stack: "Suite could not load" },
    },
  );

  expect(events(writes)[0]).toMatchObject({
    duration: "1.000",
    failed: true,
    failures: ["Suite could not load"],
  });
});

test("handles failure messages and incomplete suite metadata", () => {
  const reporter = new JestProgressReporter({ write: (text) => writes.push(text) });
  reporter.onTestResult(
    { path: "tests/incomplete.test.mjs" },
    {
      startTime: 200,
      endTime: 100,
      failureMessage: "suite failed",
      testExecError: { message: "suite could not load" },
      console: [{}],
    },
  );
  expect(events(writes).at(-1)).toMatchObject({
    duration: "0.000",
    failed: true,
    failures: ["suite failed", "suite could not load"],
    unexpectedOutput: ["console.log: "],
  });
});

test("formats failed assertions with fallback titles and messages", () => {
  const reporter = new JestProgressReporter({ write: (text) => writes.push(text) });
  reporter.onTestResult(
    { path: "tests/untitled.test.mjs" },
    { assertionResults: [{ status: "failed" }, { status: "passed" }] },
  );
  expect(events(writes).at(-1)).toMatchObject({ failed: true, failures: ["Failed test"] });
});

test("uses Jest's configured root for absolute suite paths", () => {
  const reporter = new JestProgressReporter({ rootDir: process.cwd() });
  reporter.onTestStart({ path: `${process.cwd()}\\tests\\absolute.test.mjs` });

  expect(events(writes)[0].path).toBe("tests/absolute.test.mjs");
});

test("writes captured Jest console output with its suite path", async () => {
  const directory = await mkdtemp(join(tmpdir(), "eliware-jest-console-"));
  const reportPath = join(directory, "console-output.json");
  const previous = process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
  process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT = reportPath;
  try {
    const reporter = new JestProgressReporter();
    reporter.onTestResult(
      { path: "tests/noisy.test.mjs" },
      { console: [{ type: "warn", message: "expected leak", origin: "line 4" }] },
    );
    reporter.onRunComplete();

    await expect(readFile(reportPath, "utf8")).resolves.toBe(
      '[{"testFilePath":"tests/noisy.test.mjs","type":"warn","message":"expected leak","origin":"line 4"}]',
    );
  } finally {
    if (previous === undefined) delete process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
    else process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test("does not write a console report when no report path is configured", () => {
  const previous = process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
  delete process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
  try {
    expect(() => new JestProgressReporter().onRunComplete()).not.toThrow();
  } finally {
    if (previous !== undefined) process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT = previous;
  }
});

test("redacts secrets and hides external paths in progress events", () => {
  const output = [];
  const reporter = new JestProgressReporter({
    env: { API_TOKEN: "private-token" },
    write: (text) => output.push(text),
  });
  reporter.onTestStart({ path: `${process.cwd()}\\private-token.test.mjs` });
  reporter.onTestResult(
    { path: "../outside.test.mjs" },
    { failureMessage: "private-token", numFailingTests: 1 },
  );
  expect(output.join("")).not.toContain(process.cwd());
  expect(output.join("")).not.toContain("private-token");
  expect(output.join("")).toContain("[outside repository]");
});

test("reports every suite and preserves long file paths", () => {
  const output = [];
  const path = `tests/${"long-path-segment/".repeat(100)}suite.test.mjs`;
  const reporter = new JestProgressReporter({ write: (text) => output.push(text) });
  for (let index = 0; index < 100; index++)
    reporter.onTestStart({ path: `tests/${index}.test.mjs` });
  reporter.onTestStart({ path });

  expect(output).toHaveLength(101);
  expect(events(output).at(-1).path).toBe(path);
});
