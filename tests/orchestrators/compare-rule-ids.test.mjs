import { expect, test } from "@jest/globals";
import { compareRuleIds } from "../../src/orchestrators/compare-rule-ids.mjs";

test("sorts directive IDs numerically by each segment", () => {
  expect(["E-1.10", "E-1.2", "A-1"].sort(compareRuleIds)).toEqual(["A-1", "E-1.2", "E-1.10"]);
});
