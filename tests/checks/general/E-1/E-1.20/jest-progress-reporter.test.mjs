import { afterEach, beforeEach, expect, test } from "@jest/globals";

const writes = [];
const originalWrite = process.stderr.write.bind(process.stderr);
const { default: JestProgressReporter } = await import(
  "../../../../../src/checks/general/E-1/E-1.20/jest-progress-reporter.mjs"
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

test("reports suite and test progress without human timing output", () => {
  const reporter = new JestProgressReporter();
  reporter.onTestStart({ path: "tests/example.test.mjs" });
  reporter.onTestResult(
    { path: "tests/example.test.mjs" },
    { startTime: 100, endTime: 1_100, assertionResults: [{ fullName: "works", duration: 250 }] },
  );
  expect(writes).toEqual([
    "[eliware-test-progress] start tests/example.test.mjs\n",
    "[eliware-test-progress] complete tests/example.test.mjs 1.000s\n",
    "[eliware-test-progress] test tests/example.test.mjs :: works 0.250s\n",
  ]);
});

test("reports slow tests only above five seconds", () => {
  new JestProgressReporter().onTestResult(
    { path: "tests/slow.test.mjs" },
    { assertionResults: [{ title: "unknown duration" }, { title: "slow case", duration: 5_001 }] },
  );
  expect(writes).toContain("[eliware-test-progress] slow tests/slow.test.mjs :: slow case :: 5.001s\n");
});

test("reports a normal timed test without a slow marker", () => {
  writes.length = 0;
  new JestProgressReporter().onTestResult(
    { path: "tests/normal.test.mjs" },
    { assertionResults: [{ fullName: "normal", duration: 1_000 }] },
  );
  expect(writes).toEqual([
    "[eliware-test-progress] complete tests/normal.test.mjs 0.000s\n",
    "[eliware-test-progress] test tests/normal.test.mjs :: normal 1.000s\n",
  ]);
});

test("falls back to the assertion title when fullName is absent", () => {
  new JestProgressReporter().onTestResult(
    { path: "tests/title.test.mjs" },
    { assertionResults: [{ title: "title fallback", duration: 1_000 }] },
  );
  expect(writes).toContain(
    "[eliware-test-progress] test tests/title.test.mjs :: title fallback 1.000s\n",
  );
});

test("accepts a result without assertion results", () => {
  new JestProgressReporter().onTestResult({ path: "tests/empty.test.mjs" }, {});
  expect(writes).toEqual(["[eliware-test-progress] complete tests/empty.test.mjs 0.000s\n"]);
});
