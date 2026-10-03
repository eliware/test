import { expect, test } from "@jest/globals";
import { formatOutdatedDependencies } from "../../../../src/checks/general/E-0.1/format-outdated-dependencies.mjs";

test("formats package names as latest installation targets", () => {
  expect(formatOutdatedDependencies({ jest: { current: "1.0.0", latest: "2.0.0" } })).toEqual([
    "jest@latest",
  ]);
});

test("does not depend on reported version fields", () => {
  expect(
    formatOutdatedDependencies({
      alpha: {},
      beta: { wanted: "3.0.0" },
      gamma: { current: null, latest: null, wanted: null },
    }),
  ).toEqual(["alpha@latest", "beta@latest", "gamma@latest"]);
  expect(formatOutdatedDependencies({})).toEqual([]);
  expect(formatOutdatedDependencies()).toEqual([]);
});

test("omits only the explicitly named packed smoke candidate", () => {
  expect(
    formatOutdatedDependencies({ "@eliware/test": {}, jest: {}, prettier: {} }, "@eliware/test"),
  ).toEqual(["jest@latest", "prettier@latest"]);
});
