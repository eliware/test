import { expect, test } from "@jest/globals";
import { parseJestArguments } from "../../src/cli/parse-jest-arguments.mjs";

test("separates option values, positional arguments, and arguments after the separator", () => {
  expect(
    parseJestArguments([
      "--moduleNameMapper",
      "tests/value.test.mjs",
      "tests/run.test.mjs",
      "--",
      "tests/forwarded.test.mjs",
    ]),
  ).toEqual({
    positional: ["tests/run.test.mjs"],
    optionValues: new Set(["tests/value.test.mjs"]),
    afterSeparator: ["tests/forwarded.test.mjs"],
  });
});

test("handles empty and non-string argument values", () => {
  expect(parseJestArguments()).toEqual({
    positional: [],
    optionValues: new Set(),
    afterSeparator: [],
  });
  expect(parseJestArguments([null, "--watch", "tests/run.test.mjs"]).positional).toEqual([
    "tests/run.test.mjs",
  ]);
});
