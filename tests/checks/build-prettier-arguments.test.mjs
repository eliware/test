import { expect, test } from "@jest/globals";
import { buildPrettierArguments } from "../../src/checks/build-prettier-arguments.mjs";

test("builds read-only and write formatter arguments", () => {
  expect(buildPrettierArguments()).toEqual(["--check", "."]);
  expect(buildPrettierArguments({ write: true })).toEqual(["--write", "."]);
  expect(buildPrettierArguments({ paths: ["tests/example.test.mjs", "src/example.mjs"] })).toEqual([
    "--check", "tests/example.test.mjs", "src/example.mjs",
  ]);
});
