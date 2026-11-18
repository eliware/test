import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/validation/shared/repository/repository-inventory/path-filters/is/ignored-repository-path.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
