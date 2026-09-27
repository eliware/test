import { expect, test } from "@jest/globals";
import { compareRuleIds } from "../../src/orchestrators/compare-rule-ids.mjs";

test("sorts directive IDs numerically by each segment", () => {
  expect(["E-0.1.10", "E-0.1.2", "A-0.1"].sort(compareRuleIds)).toEqual([
    "A-0.1",
    "E-0.1.2",
    "E-0.1.10",
  ]);
});
