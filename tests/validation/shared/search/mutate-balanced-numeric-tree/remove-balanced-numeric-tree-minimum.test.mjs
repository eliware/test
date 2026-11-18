import { expect, test } from "@jest/globals";
import method from "../../../../../src/validation/shared/search/mutate-balanced-numeric-tree/remove-balanced-numeric-tree-minimum.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
