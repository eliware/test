import { expect, test } from "@jest/globals";
import {
  findJestConsoleOutput,
  isDefaultJestConsoleLine,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-jest-console-output.mjs";

test("formats console output with the emitting test source", () => {
  expect(
    findJestConsoleOutput({
      testResults: [
        {
          name: "tests/example.test.mjs",
          console: [{ type: "log", message: "logged value", origin: "example test" }],
        },
      ],
    }),
  ).toEqual(["console.log in tests/example.test.mjs: logged value"]);
});

test("handles missing test and console metadata", () => {
  expect(findJestConsoleOutput()).toEqual([]);
  expect(findJestConsoleOutput({ testResults: [{ console: [{}] }, {}] })).toEqual([
    "console.log in unknown test suite: ",
  ]);
});

test("formats reporter console records and redacts message values", () => {
  expect(
    findJestConsoleOutput(
      {
        testResults: [
          {
            testFilePath: "tests/reporter.test.mjs",
            name: "tests/unused-fallback.test.mjs",
            console: [{ message: "reporter output" }],
          },
        ],
      },
      process.cwd(),
      ["private-value"],
      [
        {
          testFilePath: "tests/extra.test.mjs",
          type: "warn",
          message: " private-value ",
        },
      ],
    ),
  ).toEqual([
    "console.log in tests/reporter.test.mjs: reporter output",
    "console.warn in tests/extra.test.mjs: [REDACTED]",
  ]);
});

test("matches only console echoes emitted by the corresponding test suite", () => {
  const outputs = [
    { testFilePath: "tests/example.test.mjs", type: "warn", message: "first\nsecond" },
  ];

  expect(isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "first" }, [])).toBe(
    false,
  );
  expect(isDefaultJestConsoleLine({ suite: "tests/other.test.mjs", line: "first" }, outputs)).toBe(
    false,
  );
  expect(
    isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "console.warn" }, outputs),
  ).toBe(true);
  expect(
    isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "second" }, outputs),
  ).toBe(true);
  expect(
    isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "console.log" }, [
      { testFilePath: "tests/example.test.mjs" },
    ]),
  ).toBe(true);
  expect(
    isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "unrelated" }, [
      { testFilePath: "tests/example.test.mjs" },
    ]),
  ).toBe(false);
  expect(
    isDefaultJestConsoleLine({ suite: "tests/example.test.mjs", line: "unrelated" }, outputs),
  ).toBe(false);
});

test("normalizes absolute reporter paths outside the repository", () => {
  expect(
    findJestConsoleOutput(
      { testResults: [{ name: "C:/other/tests/outside.test.mjs", console: [{}] }] },
      process.cwd(),
    ),
  ).toEqual(["console.log in [outside repository]: "]);
});
