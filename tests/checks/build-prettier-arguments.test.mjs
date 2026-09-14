import { expect, test } from "@jest/globals";
import { buildPrettierArguments } from "../../src/checks/build-prettier-arguments.mjs";

test("builds read-only and write formatter arguments", () => {
  expect(buildPrettierArguments()).toEqual(["--check", "."]);
  expect(buildPrettierArguments({ write: true })).toEqual(["--write", "."]);
});
