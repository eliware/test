import { afterEach, beforeEach, expect, test } from "@jest/globals";

const writes = [];
const originalWrite = process.stderr.write.bind(process.stderr);
const { default: JestTimingReporter } = await import(
  "../../../../../src/checks/general/E-1/E-1.20/jest-timing-reporter.mjs"
);

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

test("reports suite start, completion, and case timing", () => {
  const reporter = new JestTimingReporter();
  reporter.onTestStart({ path: "tests/example.test.mjs" });
  reporter.onTestResult(
    { path: "tests/example.test.mjs" },
    {
      startTime: 100,
      endTime: 1_100,
      assertionResults: [{ status: "passed", fullName: "works", duration: 250 }],
    },
  );
  expect(writes).toEqual([
    "[eliware-test] Running tests/example.test.mjs...\n",
    "[eliware-test] Completed tests/example.test.mjs — 1.000s\n",
    "[eliware-test]   PASS works — 0.250s\n",
  ]);
});

test("does not report cases without durations", () => {
  const reporter = new JestTimingReporter();
  reporter.onTestResult({ path: "tests/example.test.mjs" }, { assertionResults: [{ status: "failed", title: "broken" }] });
  expect(writes).toEqual(["[eliware-test] Completed tests/example.test.mjs — 0.000s\n"]);
});

test("handles a result without assertion details", () => {
  new JestTimingReporter().onTestResult({ path: "tests/empty.test.mjs" }, {});
  expect(writes).toEqual(["[eliware-test] Completed tests/empty.test.mjs — 0.000s\n"]);
});

test("labels timed failed cases", () => {
  const reporter = new JestTimingReporter();
  reporter.onTestResult(
    { path: "tests/failing.test.mjs" },
    { assertionResults: [{ status: "failed", title: "broken", duration: 10 }] },
  );
  expect(writes).toEqual([
    "[eliware-test] Completed tests/failing.test.mjs — 0.000s\n",
    "[eliware-test]   FAILED broken — 0.010s\n",
  ]);
});
