import { expect, test } from "@jest/globals";
import { buildOxlintArguments } from "../../../../src/validation/stages/lint/build-oxlint-arguments.mjs";

test("builds strict warning-denying Oxlint arguments", () => {
  expect(buildOxlintArguments()).toEqual(["--deny-warnings", "."]);
  expect(buildOxlintArguments([], ["tests/example.test.mjs", "src/example.mjs"])).toEqual([
    "--deny-warnings",
    "tests/example.test.mjs",
    "src/example.mjs",
  ]);
});
