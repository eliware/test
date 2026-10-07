import { expect, test } from "@jest/globals";
import {
  findJestConsoleOutput,
  isDefaultJestConsoleLine,
} from "../../../../../src/validation/stages/jest/progress/find-jest-console-output.mjs";

test("formats console output with the emitting test source", () => {
  expect(
    findJestConsoleOutput([
      { testFilePath: "tests/example.test.mjs", type: "log", message: "logged value" },
    ]),
  ).toEqual(["console.log in tests/example.test.mjs: logged value"]);
});

test("handles missing test and console metadata", () => {
  expect(findJestConsoleOutput()).toEqual([]);
  expect(findJestConsoleOutput([{}])).toEqual(["console.log in unknown test suite: "]);
});

test("redacts console messages", () => {
  expect(
    findJestConsoleOutput(
      [{ testFilePath: "tests/extra.test.mjs", type: "warn", message: "private-value" }],
      process.cwd(),
      ["private-value"],
    ),
  ).toEqual(["console.warn in tests/extra.test.mjs: [REDACTED]"]);
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
  expect(isDefaultJestConsoleLine({ suite: "unknown test suite", line: "second" }, outputs)).toBe(
    true,
  );
  const missingMetadata = [{ testFilePath: "tests/example.test.mjs" }];
  expect(
    isDefaultJestConsoleLine({ suite: "unknown test suite", line: "console.log" }, missingMetadata),
  ).toBe(true);
  expect(
    isDefaultJestConsoleLine({ suite: "unknown test suite", line: "unmatched" }, missingMetadata),
  ).toBe(false);
});

test("normalizes absolute reporter paths outside the repository", () => {
  expect(
    findJestConsoleOutput([{ testFilePath: "C:/other/tests/outside.test.mjs" }], process.cwd()),
  ).toEqual(["console.log in [outside repository]: "]);
});
