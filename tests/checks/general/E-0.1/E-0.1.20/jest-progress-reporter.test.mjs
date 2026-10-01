import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const writes = [];
const stdoutWrites = [];
const originalWrite = process.stderr.write.bind(process.stderr);
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const { default: JestProgressReporter } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.20/jest-progress-reporter.mjs");

beforeEach(() => {
  writes.length = 0;
  stdoutWrites.length = 0;
  process.stderr.write = (value) => {
    writes.push(value);
    return true;
  };
  process.stdout.write = (value) => {
    stdoutWrites.push(value);
    return true;
  };
});

afterEach(() => {
  process.stderr.write = originalWrite;
  process.stdout.write = originalStdoutWrite;
});

test("reports suite progress without per-test output", () => {
  const reporter = new JestProgressReporter();
  reporter.onTestStart({ path: "tests/example.test.mjs" });
  reporter.onTestResult(
    { path: "tests/example.test.mjs" },
    { startTime: 100, endTime: 1_100, assertionResults: [{ fullName: "works", duration: 250 }] },
  );
  expect(writes).toEqual([
    "[eliware-test-progress] start tests/example.test.mjs\n",
    "[eliware-test-progress] complete tests/example.test.mjs 1.000s\n",
  ]);
  expect(stdoutWrites).toEqual(writes);
});

test("uses Jest's configured root for absolute suite paths", () => {
  const reporter = new JestProgressReporter({ rootDir: process.cwd() });
  reporter.onTestStart({ path: `${process.cwd()}\\tests\\absolute.test.mjs` });

  expect(writes).toContain("[eliware-test-progress] start tests/absolute.test.mjs\n");
});

test("reports slow tests only above five seconds", () => {
  new JestProgressReporter().onTestResult(
    { path: "tests/slow.test.mjs" },
    { assertionResults: [{ title: "unknown duration" }, { title: "slow case", duration: 5_001 }] },
  );
  expect(writes).toContain(
    "[eliware-test-progress] slow tests/slow.test.mjs :: slow case :: 5.001s\n",
  );
});

test("reports a normal timed test without a slow marker", () => {
  writes.length = 0;
  new JestProgressReporter().onTestResult(
    { path: "tests/normal.test.mjs" },
    { assertionResults: [{ fullName: "normal", duration: 1_000 }] },
  );
  expect(writes).toEqual(["[eliware-test-progress] complete tests/normal.test.mjs 0.000s\n"]);
});

test("uses the assertion title for slow-test diagnostics when fullName is absent", () => {
  new JestProgressReporter().onTestResult(
    { path: "tests/title.test.mjs" },
    { assertionResults: [{ title: "title fallback", duration: 6_000 }] },
  );
  expect(writes).toEqual([
    "[eliware-test-progress] complete tests/title.test.mjs 0.000s\n",
    "[eliware-test-progress] slow tests/title.test.mjs :: title fallback :: 6.000s\n",
  ]);
});

test("accepts a result without assertion results", () => {
  new JestProgressReporter().onTestResult({ path: "tests/empty.test.mjs" }, {});
  expect(writes).toEqual(["[eliware-test-progress] complete tests/empty.test.mjs 0.000s\n"]);
  const reportFile = process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
  delete process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT;
  try {
    new JestProgressReporter().onRunComplete();
  } finally {
    if (reportFile !== undefined) process.env.ELIWARE_TEST_JEST_CONSOLE_REPORT = reportFile;
  }
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
      {
        console: [{ type: "warn", message: "expected leak", origin: "line 4" }],
      },
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

test("redacts secrets, hides external paths, and caps reporter output", () => {
  const output = [];
  const stdoutOutput = [];
  const reporter = new JestProgressReporter({
    env: { API_TOKEN: "private-token" },
    write: (text) => output.push(text),
    writeStdout: (text) => stdoutOutput.push(text),
  });
  reporter.onTestStart({ path: `${process.cwd()}\\private-token.test.mjs` });
  reporter.onTestResult(
    { path: "../outside.test.mjs" },
    { assertionResults: [{ title: "private-token", duration: 10 }] },
  );
  expect(output.join("")).not.toContain(process.cwd());
  expect(output.join("")).not.toContain("private-token");
  expect(output.join("")).toContain("[outside repository]");
  expect(stdoutOutput.join("")).toBe(output.join(""));
});

test("caps total reporter output", () => {
  const output = [];
  const stdoutOutput = [];
  const reporter = new JestProgressReporter({
    write: (text) => output.push(text),
    writeStdout: (text) => stdoutOutput.push(text),
    maxOutputLength: 20,
  });
  reporter.onTestStart({ path: "tests/a.test.mjs" });
  reporter.onTestStart({ path: "tests/b.test.mjs" });
  expect(output.join("").length).toBe(20);
  expect(stdoutOutput.join("").length).toBe(20);
});
