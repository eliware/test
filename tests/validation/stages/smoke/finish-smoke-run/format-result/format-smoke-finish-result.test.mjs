import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/stages/smoke/finish-smoke-run/format-result/format-smoke-finish-result.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
