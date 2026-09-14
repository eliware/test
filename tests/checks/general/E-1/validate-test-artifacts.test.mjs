import { expect, test } from "@jest/globals";
import { findMisplacedArtifacts } from "../../../../src/checks/general/E-1/validate-test-artifacts.mjs";

test("finds fixture-like files outside artifacts", () => {
  expect(findMisplacedArtifacts(["fixture.mjs"], ["nested.test-utils.test.mjs"])).toEqual([
    "fixture.mjs", "nested.test-utils.test.mjs",
  ]);
  expect(findMisplacedArtifacts(["artifacts/fixture.mjs"], [])).toEqual([]);
});
