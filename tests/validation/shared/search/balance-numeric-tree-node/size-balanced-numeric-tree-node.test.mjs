import { expect, test } from "@jest/globals";
import method from "../../../../../src/validation/shared/search/balance-numeric-tree-node/size-balanced-numeric-tree-node.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
