import { expect, test } from "@jest/globals";
import { compareRuleIds } from "../../../src/validation/check-discovery/compare-rule-ids.mjs";

test("sorts directive IDs numerically by each segment", () => {
  expect(["E-0.1.10", "E-0.1.2", "A-0.1"].sort(compareRuleIds)).toEqual([
    "A-0.1",
    "E-0.1.2",
    "E-0.1.10",
  ]);
});

test("sorts a shorter directive ID before a longer matching prefix", () => {
  expect(compareRuleIds("E-0.1.1", "E-0.1")).toBeGreaterThan(0);
  expect(compareRuleIds("E-0.1", "E-0.1.1")).toBeLessThan(0);
});

test("uses the full ID as a tie-breaker when numeric segments match", () => {
  expect(compareRuleIds("A-0.1", "E-0.1")).toBeLessThan(0);
});
