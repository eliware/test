import { expect, test } from "@jest/globals";
import { parseFocusedArguments } from "../../src/cli/parse-focused-arguments.mjs";

test("separates option values from focused positional paths", () => {
  expect(parseFocusedArguments([
    "--moduleNameMapper", "tests/value.test.mjs", "tests/example.test.mjs",
  ]).positional).toEqual(["tests/example.test.mjs"]);
});
