import { expect, test } from "@jest/globals";
import method from "../../../../../../../../src/validation/shared/repository/create-repository/inventory/documentation/path-policy/should-skip-documentation-path.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
