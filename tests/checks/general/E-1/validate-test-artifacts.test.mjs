import { expect, test } from "@jest/globals";
import { findMisplacedArtifacts } from "../../../../src/checks/general/E-1/validate-test-artifacts.mjs";

test("finds fixture-like files outside artifacts", () => {
  expect(findMisplacedArtifacts(["fixture.mjs"], ["nested.test-utils.test.mjs"])).toEqual([
    "fixture.mjs", "nested.test-utils.test.mjs",
  ]);
  expect(findMisplacedArtifacts(["artifacts/fixture.mjs"], [])).toEqual([]);
});

test("finds snapshots, generated data, and test helpers by structure", () => {
  expect(findMisplacedArtifacts([], [
    "__snapshots__/module.test.mjs.snap",
    "generated/values.json",
    "support/loader.mjs",
    "data/fixture-values.json",
    "arbitrary-helper.mjs",
  ])).toEqual([
    "__snapshots__/module.test.mjs.snap",
    "generated/values.json",
    "support/loader.mjs",
    "data/fixture-values.json",
    "arbitrary-helper.mjs",
  ]);
});

test("does not flag artifact content already under artifacts", () => {
  expect(findMisplacedArtifacts([], [
    "artifacts/__snapshots__/module.test.mjs.snap",
    "artifacts/generated/values.json",
    "artifacts/support/loader.mjs",
    "artifacts/arbitrary-helper.mjs",
  ])).toEqual([]);
});
