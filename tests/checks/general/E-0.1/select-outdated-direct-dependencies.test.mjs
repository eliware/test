import { expect, test } from "@jest/globals";
import { selectOutdatedDirectDependencies } from "../../../../src/checks/general/E-0.1/select-outdated-direct-dependencies.mjs";

test("selects only outdated package dependencies", () => {
  expect(
    selectOutdatedDirectDependencies(
      { dependencies: { runtime: "1" }, devDependencies: { tooling: "1" } },
      { runtime: { current: "1", latest: "2" }, tooling: { current: "1", latest: "2" } },
    ),
  ).toEqual({ runtime: { current: "1", latest: "2" } });
});

test("returns no release dependencies for peer, optional, or development-only packages", () => {
  expect(
    selectOutdatedDirectDependencies(
      { peerDependencies: { peer: "1" }, optionalDependencies: { optional: "1" } },
      { peer: {}, optional: {} },
    ),
  ).toEqual({});
});

test("returns no release dependencies when package metadata lacks an object dependency map", () => {
  expect(selectOutdatedDirectDependencies(undefined, { alpha: {} })).toEqual({});
  expect(selectOutdatedDirectDependencies({ dependencies: "invalid" }, { alpha: {} })).toEqual({});
});

test("returns no outdated dependencies when the registry has no report", () => {
  expect(selectOutdatedDirectDependencies({ dependencies: { alpha: "1" } }, undefined)).toEqual({});
});
