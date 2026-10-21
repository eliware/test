import { expect, test } from "@jest/globals";
import { parseJestArguments } from "../../../src/cli/parse/jest-arguments.mjs";

test("separates option values, positional arguments, and arguments after the separator", () => {
  expect(
    parseJestArguments([
      "--moduleNameMapper",
      "mapping-value",
      "mapping-value",
      "run-target",
      "--",
      "forwarded-value",
    ]),
  ).toEqual({
    positional: ["run-target"],
    optionValues: new Set(["mapping-value"]),
    afterSeparator: ["forwarded-value"],
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
