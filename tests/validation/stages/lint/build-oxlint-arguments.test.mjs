import { expect, test } from "@jest/globals";
import { buildOxlintArguments } from "../../../../src/validation/stages/lint/build-oxlint-arguments.mjs";

test("builds strict warning-denying Oxlint arguments", () => {
  expect(buildOxlintArguments()).toEqual([
    "--deny-warnings",
    "--no-error-on-unmatched-pattern",
    ".",
  ]);
  expect(buildOxlintArguments([], ["tests/example.test.mjs", "src/example.mjs"])).toEqual([
    "--deny-warnings",
    "--no-error-on-unmatched-pattern",
    "tests/example.test.mjs",
    "src/example.mjs",
  ]);
});
