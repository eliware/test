import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/validation/shared/repository/repository-inventory/path-filters/is/repository-fixture-path.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
