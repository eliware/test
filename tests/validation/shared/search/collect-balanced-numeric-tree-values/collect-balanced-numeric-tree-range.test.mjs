import { expect, test } from "@jest/globals";
import method from "../../../../../src/validation/shared/search/collect-balanced-numeric-tree-values/collect-balanced-numeric-tree-range.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
