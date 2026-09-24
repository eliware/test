import { expect, test } from "@jest/globals";
import { formatOutdatedDependencies } from "../../../../src/checks/general/E-1/format-outdated-dependencies.mjs";

test("formats current and latest versions", () => {
  expect(formatOutdatedDependencies({ jest: { current: "1.0.0", latest: "2.0.0" } })).toEqual(["jest (1.0.0 -> 2.0.0)"]);
});

test("uses wanted versions and unknown fallbacks for missing data", () => {
  expect(formatOutdatedDependencies({ alpha: {}, beta: { wanted: "3.0.0" }, gamma: { current: null, latest: null, wanted: null } })).toEqual([
    "alpha (unknown -> unknown)",
    "beta (unknown -> 3.0.0)",
    "gamma (unknown -> unknown)",
  ]);
  expect(formatOutdatedDependencies({})).toEqual([]);
  expect(formatOutdatedDependencies()).toEqual([]);
});
