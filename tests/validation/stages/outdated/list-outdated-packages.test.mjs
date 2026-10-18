import { expect, test } from "@jest/globals";
import { listOutdatedPackages } from "../../../../src/validation/stages/outdated/list-outdated-packages.mjs";

test("sorts package findings and omits the smoke candidate", () => {
  expect(listOutdatedPackages({ zeta: {}, alpha: {}, ignored: {} }, "ignored")).toEqual([
    "alpha@latest",
    "zeta@latest",
  ]);
});

test("returns an empty list when no packages are outdated", () => {
  expect(listOutdatedPackages({}, undefined)).toEqual([]);
});
