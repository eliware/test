import { expect, test } from "@jest/globals";
import findPrunedAncestor from "../../../../../../src/validation/shared/repository/create-repository/directory/find-pruned-ancestor.mjs";
test("finds the nearest pruned ancestor from the repository root", () => {
  expect(findPrunedAncestor("dist/generated/output", new Set(["dist", "dist/generated"]))).toBe(
    "dist",
  );
});
test("returns no ancestor when the path is outside pruned directories", () => {
  expect(findPrunedAncestor("src/reports", new Set(["dist", "coverage"]))).toBeUndefined();
  expect(findPrunedAncestor("", new Set(["dist"]))).toBeUndefined();
});
