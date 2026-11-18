import { expect, test } from "@jest/globals";
import method from "../../../src/checks/check-result/assert-check-result.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
