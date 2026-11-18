import { expect, test } from "@jest/globals";
import method from "../../../src/checks/check-result/fail.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
