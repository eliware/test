import { expect, test } from "@jest/globals";
import { focusedPathFrom, parseFocusedArguments } from "../../src/cli/parse-focused-arguments.mjs";

test("separates option values from focused positional paths", () => {
  expect(parseFocusedArguments([
    "--moduleNameMapper", "tests/value.test.mjs", "tests/example.test.mjs",
  ]).positional).toEqual(["tests/example.test.mjs"]);
});

test("handles empty and non-string argument values", () => {
  expect(parseFocusedArguments()).toEqual({ positional: [], optionValues: new Set() });
  expect(focusedPathFrom()).toBeUndefined();
  expect(parseFocusedArguments([null, "--watch"]).positional).toEqual([]);
  expect(parseFocusedArguments(["--watch", "tests/example.test.mjs"]).positional).toEqual([
    "tests/example.test.mjs",
  ]);
  expect(parseFocusedArguments(["--", "tests/example.test.mjs"]).positional).toEqual([
    "tests/example.test.mjs",
  ]);
  expect(parseFocusedArguments(["--testNamePattern", "tests/example.test.mjs", "tests/example.test.mjs"]).positional)
    .toEqual([]);
  expect(focusedPathFrom(["tests/example.test.mjs"])).toBe("tests/example.test.mjs");
  expect(focusedPathFrom(["specs/example.spec.mjs"])).toBeUndefined();
  expect(focusedPathFrom(["src/example.mjs"])).toBeUndefined();
});
