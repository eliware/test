import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/shared/repository/repository-inventory/paths/inventory-directory.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
