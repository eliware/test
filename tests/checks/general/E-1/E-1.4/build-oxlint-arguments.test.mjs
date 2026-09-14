import { expect, test } from "@jest/globals";
import { buildOxlintArguments } from "../../../../../src/checks/general/E-1/E-1.4/build-oxlint-arguments.mjs";

test("builds strict warning-denying Oxlint arguments", () => {
  expect(buildOxlintArguments()).toEqual(["--deny-warnings", "."]);
});
