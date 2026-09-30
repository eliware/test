import { expect, test } from "@jest/globals";
import { findMisplacedArtifacts } from "../../../../src/checks/general/E-0.1/validate-test-artifacts.mjs";

test("finds fixture-like files that are not in the root test-fixtures directory", () => {
  expect(findMisplacedArtifacts(["fixture.mjs"], ["nested.test-utils.test.mjs"])).toEqual([
    "fixture.mjs",
    "nested.test-utils.test.mjs",
  ]);
  expect(findMisplacedArtifacts(["artifacts/fixture.mjs"], [])).toEqual(["artifacts/fixture.mjs"]);
});

test("finds checked-in snapshots, generated data, and test helpers by structure", () => {
  expect(
    findMisplacedArtifacts(
      [],
      [
        "artifacts/__snapshots__/module.test.mjs.snap",
        "artifacts/generated/values.json",
        "artifacts/support/loader.mjs",
        "artifacts/arbitrary-helper.mjs",
        "__snapshots__/module.test.mjs.snap",
        "generated/values.json",
        "support/loader.mjs",
        "data/fixture-values.json",
        "arbitrary-helper.mjs",
      ],
    ),
  ).toEqual([
    "artifacts/__snapshots__/module.test.mjs.snap",
    "artifacts/generated/values.json",
    "artifacts/support/loader.mjs",
    "artifacts/arbitrary-helper.mjs",
    "__snapshots__/module.test.mjs.snap",
    "generated/values.json",
    "support/loader.mjs",
    "data/fixture-values.json",
    "arbitrary-helper.mjs",
  ]);
});

test("flags checked-in helpers and fixtures placed under artifacts", () => {
  expect(
    findMisplacedArtifacts(
      [],
      [
        "artifacts/__snapshots__/module.test.mjs.snap",
        "artifacts/generated/values.json",
        "artifacts/support/loader.mjs",
        "artifacts/arbitrary-helper.mjs",
      ],
    ),
  ).toEqual([
    "artifacts/__snapshots__/module.test.mjs.snap",
    "artifacts/generated/values.json",
    "artifacts/support/loader.mjs",
    "artifacts/arbitrary-helper.mjs",
  ]);
});

test("allows ordinary source, test, and data files outside artifact locations", () => {
  expect(
    findMisplacedArtifacts(
      ["checks/module.mjs", "data/records.json"],
      ["checks/module.test.mjs", "data/records.txt"],
    ),
  ).toEqual([]);
});
